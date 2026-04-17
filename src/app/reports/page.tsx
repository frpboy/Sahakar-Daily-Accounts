"use client";

import { useEffect, useState, Suspense, useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import {
  formatCurrency,
  calculateTotalSales,
  calculateProfit,
} from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "boneyard-js/react";
import { getMyProfile, deleteDailyAccount } from "@/lib/actions/accounts";

interface ReportEntry {
  id: string;
  date: string;
  outletId: string;
  outletName: string;
  saleCash: number;
  saleUpi: number;
  saleCredit: number;
  expenses: number;
  purchase: number;
  closingStock: number;
}

interface Outlet {
  id: string;
  name: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

function ReportsPageInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ReportEntry[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(
    searchParams.get("outlet") ?? "all"
  );
  const [startDate, setStartDate] = useState<string>(
    searchParams.get("from") ?? ""
  );
  const [endDate, setEndDate] = useState<string>(
    searchParams.get("to") ?? ""
  );
  const [page, setPage] = useState<number>(
    Math.max(1, Number(searchParams.get("page") || "1"))
  );
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const canDelete = userRole === "admin" || userRole === "ho_accountant";
  const ROW_HEIGHT = 49;
  const VIEWPORT_HEIGHT = 500;
  const OVERSCAN = 8;

  function updateUrl(outlet: string, from: string, to: string, nextPage: number) {
    const params = new URLSearchParams();
    if (outlet && outlet !== "all") params.set("outlet", outlet);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (nextPage > 1) params.set("page", nextPage.toString());
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleOutletChange(val: string) {
    setSelectedOutletId(val);
    setPage(1);
    updateUrl(val, startDate, endDate, 1);
  }

  function handleStartDate(val: string) {
    setStartDate(val);
    setPage(1);
    updateUrl(selectedOutletId, val, endDate, 1);
  }

  function handleEndDate(val: string) {
    setEndDate(val);
    setPage(1);
    updateUrl(selectedOutletId, startDate, val, 1);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    updateUrl(selectedOutletId, startDate, endDate, nextPage);
  }

  function handleClear() {
    setSelectedOutletId("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
    router.replace(pathname, { scroll: false });
  }

  useEffect(() => {
    getMyProfile().then((r) => {
      if (r.success && r.data) setUserRole(r.data.role);
    });
  }, []);

  useEffect(() => {
    if (outlets.length > 0) return;

    let cancelled = false;
    void fetch("/api/outlets-list")
      .then((response) => (response.ok ? response.json() : []))
      .then((payload: Outlet[]) => {
        if (!cancelled) setOutlets(Array.isArray(payload) ? payload : []);
      })
      .catch(() => {
        if (!cancelled) setOutlets([]);
      });

    return () => {
      cancelled = true;
    };
  }, [outlets.length]);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsDataLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOutletId && selectedOutletId !== "all") {
        params.set("outletId", selectedOutletId);
      }
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", page.toString());
      params.set("pageSize", "50");

      const reportsResponse = await fetch(`/api/all-reports?${params.toString()}`, { signal });

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setData(reportsData.data ?? []);
        setPagination((prev) => reportsData.pagination ?? prev);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to fetch reports:", error);
      }
    } finally {
      setIsDataLoading(false);
    }
  }, [selectedOutletId, startDate, endDate, page]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchData(controller.signal);
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [fetchData]);

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

  async function handleExportCSV() {
    setIsExporting(true);
    const params = new URLSearchParams();
    if (selectedOutletId && selectedOutletId !== "all") params.set("outletId", selectedOutletId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("includeAll", "true");

    try {
      const response = await fetch(`/api/all-reports?${params.toString()}`);
      const payload = await response.json();
      const exportData = (payload.data ?? []).map((row: ReportEntry) => {
        const total = calculateTotalSales(row.saleCash, row.saleUpi, row.saleCredit);
        return {
          Date: format(new Date(row.date), "yyyy-MM-dd"),
          Outlet: row.outletName,
          Cash: row.saleCash,
          UPI: row.saleUpi,
          Credit: row.saleCredit,
          Total: total,
          Expenses: row.expenses,
          Purchase: row.purchase,
          ClosingStock: row.closingStock,
          Profit: calculateProfit(total, row.expenses, row.purchase),
        };
      });
      const { exportToCSV } = await import("@/lib/export");
      exportToCSV(exportData, `Sahakar_Reports_${selectedOutletId}_${format(new Date(), "yyyyMMdd")}`);
    } catch {
      alert("Failed to export all filtered rows");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportPDF() {
    setIsExporting(true);
    try {
      const { exportToPDF } = await import("@/lib/export");
      await exportToPDF("reports-table-container", `Sahakar Financial Report - ${selectedOutletId === 'all' ? 'All Outlets' : data[0]?.outletName || ''}`);
    } finally {
      setIsExporting(false);
    }
  }


  const totals = data.reduce(
    (acc, row) => {
      acc.sales += calculateTotalSales(
        row.saleCash,
        row.saleUpi,
        row.saleCredit
      );
      acc.expenses += row.expenses;
      return acc;
    },
    { sales: 0, expenses: 0 }
  );

  const virtualState = useMemo(() => {
    const total = data.length;
    if (total === 0) {
      return { start: 0, end: 0, topPad: 0, bottomPad: 0, rows: [] as ReportEntry[] };
    }

    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
    const end = Math.min(total, start + visibleCount);
    const topPad = start * ROW_HEIGHT;
    const bottomPad = Math.max(0, (total - end) * ROW_HEIGHT);

    return {
      start,
      end,
      topPad,
      bottomPad,
      rows: data.slice(start, end),
    };
  }, [data, scrollTop]);

  return (
    <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Reports</h1>
            <p className="text-gray-500 mt-1">
              View and analyze all outlet data
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={data.length === 0 || isExporting}
              className="h-10 border-gray-200"
            >
              <FileText className="h-4 w-4 mr-2 text-green-600" />
              {isExporting ? "Working..." : "Export CSV"}
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              disabled={data.length === 0 || isExporting}
              className="h-10 border-gray-200"
            >
              <Printer className="h-4 w-4 mr-2 text-blue-600" />
              {isExporting ? "Working..." : "Print PDF"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6 items-end">
              <div className="min-w-[240px] flex-1">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Outlet
                </label>
                <Select
                  value={selectedOutletId}
                  onValueChange={handleOutletChange}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue placeholder="All Outlets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outlets</SelectItem>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {(selectedOutletId !== "all" || startDate || endDate) && (
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
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.sales)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.expenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p
                className={`text-2xl font-bold ${totals.sales - totals.expenses >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(totals.sales - totals.expenses)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Entries ({pagination.total})</CardTitle>
          </CardHeader>
          <Skeleton
            name="reports-table"
            loading={isDataLoading}
            fallback={
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
            fixture={
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {["Date", "Outlet", "Cash", "UPI", "Credit", "Total", "Expenses", "Profit"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-sm font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-sm">01 Jan 2025</td>
                        <td className="px-4 py-3 text-sm font-medium">Sahakar Pharmacy</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">₹12,500.00</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">₹8,200.00</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">₹3,000.00</td>
                        <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-green-600">₹23,700.00</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-red-600">₹4,500.00</td>
                        <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-green-600">₹19,200.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          >
            <CardContent className="p-0" id="reports-table-container">
              <div
                ref={listRef}
                className="overflow-x-auto overflow-y-auto"
                style={{ maxHeight: `${VIEWPORT_HEIGHT}px` }}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Outlet</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Cash</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">UPI</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Credit</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Expenses</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Profit</th>
                      {canDelete && <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={canDelete ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                          No entries found
                        </td>
                      </tr>
                    ) : (
                      <>
                        {virtualState.topPad > 0 && (
                          <tr>
                            <td colSpan={canDelete ? 9 : 8} style={{ height: `${virtualState.topPad}px`, padding: 0, border: 0 }} />
                          </tr>
                        )}
                        {virtualState.rows.map((row) => {
                        const totalSales = calculateTotalSales(row.saleCash, row.saleUpi, row.saleCredit);
                        const profit = calculateProfit(totalSales, row.expenses, row.purchase);
                        return (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{format(new Date(row.date), "dd MMM yyyy")}</td>
                            <td className="px-4 py-3 text-sm font-medium">{row.outletName}</td>
                            <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(row.saleCash)}</td>
                            <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(row.saleUpi)}</td>
                            <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(row.saleCredit)}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-green-600">{formatCurrency(totalSales)}</td>
                            <td className="px-4 py-3 text-right text-sm tabular-nums text-red-600">{formatCurrency(row.expenses)}</td>
                            <td className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(profit)}
                            </td>
                            {canDelete && (
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingId === row.id}
                                  onClick={() => handleDelete(row.id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                        {virtualState.bottomPad > 0 && (
                          <tr>
                            <td colSpan={canDelete ? 9 : 8} style={{ height: `${virtualState.bottomPad}px`, padding: 0, border: 0 }} />
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Skeleton>
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

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsPageInner />
    </Suspense>
  );
}
