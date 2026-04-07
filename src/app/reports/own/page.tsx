"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, calculateTotalSales, calculateProfit } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Printer, Pencil, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { getMyProfile, deleteDailyAccount } from "@/lib/actions/accounts";
import Link from "next/link";

interface OwnReportEntry {
  id: string;
  date: string;
  saleCash: number;
  saleUpi: number;
  saleCredit: number;
  expenses: number;
  purchase: number;
  closingStock: number;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const THIRTY_ONE_DAYS_MS = 31 * 24 * 60 * 60 * 1000;

function isWithin31Days(dateStr: string): boolean {
  const entryDate = new Date(dateStr);
  return Date.now() - entryDate.getTime() <= THIRTY_ONE_DAYS_MS;
}

function OwnReportsPageInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<OwnReportEntry[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [outletName, setOutletName] = useState<string>("");
  const [outletId, setOutletId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(searchParams.get("from") ?? "");
  const [endDate, setEndDate] = useState<string>(searchParams.get("to") ?? "");
  const [page, setPage] = useState<number>(Math.max(1, Number(searchParams.get("page") || "1")));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  // ho_accountant has no date restriction; outlet_manager is bound to 31 days
  const canEditAll = userRole === "ho_accountant" || userRole === "admin";

  useEffect(() => {
    getMyProfile().then((r) => {
      if (r.success && r.data) {
        setUserRole(r.data.role);
        setOutletId(r.data.outletId ?? "");
      }
    });
  }, []);

  useEffect(() => {
    fetchOwnData();
  }, [startDate, endDate, page]);

  function updateUrl(from: string, to: string, nextPage: number) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (nextPage > 1) params.set("page", nextPage.toString());
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  async function fetchOwnData() {
    setIsDataLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", page.toString());
      params.set("pageSize", "50");

      const response = await fetch(`/api/own-reports?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        const rows = result.data ?? [];
        setData(rows);
        setPagination(result.pagination ?? pagination);
        if (rows.length > 0 && rows[0].outletName) {
          setOutletName(rows[0].outletName);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsDataLoading(false);
    }
  }

  function handleStartDate(val: string) {
    setStartDate(val);
    setPage(1);
    updateUrl(val, endDate, 1);
  }

  function handleEndDate(val: string) {
    setEndDate(val);
    setPage(1);
    updateUrl(startDate, val, 1);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    updateUrl(startDate, endDate, nextPage);
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    setPage(1);
    router.replace(pathname, { scroll: false });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    setDeletingId(id);
    const result = await deleteDailyAccount(id);
    if (result.success) {
      setData((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(result.error || "Failed to delete entry");
    }
    setDeletingId(null);
  }

  function handleExportCSV() {
    if (data.length === 0) return;
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("includeAll", "true");

    fetch(`/api/own-reports?${params.toString()}`)
      .then((response) => response.json())
      .then((payload) => {
        const exportData = (payload.data ?? []).map((row: OwnReportEntry) => {
          const totalSales = calculateTotalSales(row.saleCash, row.saleUpi, row.saleCredit);
          return {
            Date: format(new Date(row.date), "yyyy-MM-dd"),
            Cash: row.saleCash,
            UPI: row.saleUpi,
            Credit: row.saleCredit,
            "Total Sales": totalSales,
            Expenses: row.expenses,
            Purchase: row.purchase,
            "Closing Stock": row.closingStock,
            Profit: calculateProfit(totalSales, row.expenses, row.purchase),
          };
        });
        exportToCSV(exportData, `Sahakar_OwnReport_${format(new Date(), "yyyyMMdd")}`);
      })
      .catch(() => {
        alert("Failed to export all filtered rows");
      });
  }

  function handleExportPDF() {
    exportToPDF("own-reports-table-container", `Sahakar Financial Report - ${outletName || "My Outlet"}`);
  }

  const totals = data.reduce(
    (acc, row) => {
      acc.sales += calculateTotalSales(row.saleCash, row.saleUpi, row.saleCredit);
      acc.expenses += row.expenses;
      acc.purchase += row.purchase;
      return acc;
    },
    { sales: 0, expenses: 0, purchase: 0 }
  );

  return (
    <Container className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Outlet Reports</h1>
          <p className="text-gray-500 mt-1">
            {outletName ? `${outletName} — ` : ""}
            {startDate || endDate
              ? `${startDate || "All"} to ${endDate || "Today"}`
              : "All entries"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={data.length === 0}
            className="h-10 border-gray-200"
          >
            <FileText className="h-4 w-4 mr-2 text-green-600" />
            Export CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            disabled={data.length === 0}
            className="h-10 border-gray-200"
          >
            <Printer className="h-4 w-4 mr-2 text-blue-600" />
            Print PDF
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDate(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDate(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                onClick={handleClear}
                className="h-12 px-4 text-gray-400 font-bold hover:text-red-500 hover:bg-red-50 transition-all"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.sales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Net Profit</p>
            <p className={`text-2xl font-bold ${totals.sales - totals.expenses >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totals.sales - totals.expenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Entries ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0" id="own-reports-table-container">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Cash</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">UPI</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Credit</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Expenses</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Closing Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Profit</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isDataLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  data.map((row) => {
                    const totalSales = calculateTotalSales(row.saleCash, row.saleUpi, row.saleCredit);
                    const profit = calculateProfit(totalSales, row.expenses, row.purchase);
                    const editable = canEditAll || isWithin31Days(row.date);
                    const editHref = `/entry?date=${row.date}${outletId ? `&outletId=${outletId}` : ""}`;
                    return (
                      <tr key={row.id} className={`hover:bg-gray-50 ${!editable ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3 text-sm">{format(new Date(row.date), "dd MMM yyyy")}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(row.saleCash)}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(row.saleUpi)}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(row.saleCredit)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-green-600">{formatCurrency(totalSales)}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-red-600">{formatCurrency(row.expenses)}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(row.closingStock)}</td>
                        <td className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(profit)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {editable ? (
                              <>
                                <Link href={editHref}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingId === row.id}
                                  onClick={() => handleDelete(row.id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span title="Entry locked — older than 31 days">
                                <Lock className="h-3.5 w-3.5 text-gray-300" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between gap-4 mt-4">
        <p className="text-sm text-gray-500">
          Page {pagination.page} of {pagination.totalPages} • {pagination.total} total entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default function OwnReportsPage() {
  return (
    <Suspense fallback={null}>
      <OwnReportsPageInner />
    </Suspense>
  );
}
