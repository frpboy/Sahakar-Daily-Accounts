"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { Container } from "@/components/ui/container";
import {
  formatCurrency,
  calculateTotalSales,
  calculateProfit,
} from "@/lib/utils";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function ReportsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ReportEntry[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "ho_accountant")) {
      fetchData();
    }
  }, [user, selectedOutletId]);

  async function fetchData() {
    setIsDataLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOutletId) {
        params.set("outletId", selectedOutletId);
      }

      const [reportsResponse, outletsResponse] = await Promise.all([
        fetch(`/api/all-reports?${params.toString()}`),
        fetch("/api/outlets-list"),
      ]);

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setData(reportsData);
      }

      if (outletsResponse.ok) {
        const outletsData = await outletsResponse.json();
        setOutlets(outletsData);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsDataLoading(false);
    }
  }

  function handleExportCSV() {
    if (data.length === 0) return;

    const headers = [
      "Date",
      "Outlet",
      "Cash",
      "UPI",
      "Credit",
      "Total Sales",
      "Expenses",
      "Purchase",
      "Closing Stock",
      "Profit",
    ];
    const rows = data.map((row) => {
      const totalSales = calculateTotalSales(
        row.saleCash,
        row.saleUpi,
        row.saleCredit
      );
      const profit = calculateProfit(totalSales, row.expenses, row.purchase);
      return [
        row.date,
        row.outletName,
        row.saleCash.toFixed(2),
        row.saleUpi.toFixed(2),
        row.saleCredit.toFixed(2),
        totalSales.toFixed(2),
        row.expenses.toFixed(2),
        row.purchase.toFixed(2),
        row.closingStock.toFixed(2),
        profit.toFixed(2),
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "ho_accountant") {
    router.push("/reports/own");
    return null;
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

  return (
    <>
      <TopNav />
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Reports</h1>
            <p className="text-gray-500 mt-1">
              View and analyze all outlet data
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="w-64">
                <label className="text-sm font-medium mb-2 block">
                  Filter by Outlet
                </label>
                <Select
                  value={selectedOutletId}
                  onValueChange={setSelectedOutletId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Outlets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Outlets</SelectItem>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <CardTitle>All Entries ({data.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Outlet
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Cash
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      UPI
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Credit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isDataLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No entries found
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => {
                      const totalSales = calculateTotalSales(
                        row.saleCash,
                        row.saleUpi,
                        row.saleCredit
                      );
                      const profit = calculateProfit(
                        totalSales,
                        row.expenses,
                        row.purchase
                      );
                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(row.date), "dd MMM yyyy")}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {row.outletName}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            {formatCurrency(row.saleCash)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            {formatCurrency(row.saleUpi)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            {formatCurrency(row.saleCredit)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold font-mono text-green-600">
                            {formatCurrency(totalSales)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-red-600">
                            {formatCurrency(row.expenses)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-sm font-bold font-mono ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(profit)}
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
      </Container>
    </>
  );
}
