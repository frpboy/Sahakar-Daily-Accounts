"use client";

import { useEffect, useState } from "react";

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  calculateTotalSales,
  calculateProfit,
} from "@/lib/utils";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function OwnReportsPage() {
  const [data, setData] = useState<OwnReportEntry[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Default to a sample outlet ID since auth is disabled, or use the first available one.
  // In a real scenario without auth, we might want to let the user pick an outlet.
  const sampleOutletId = "f67bfedb-5141-4b12-a388-72dca5cf532a";

  useEffect(() => {
    fetchOwnData();
  }, []);

  async function fetchOwnData() {
    try {
      const response = await fetch(
        `/api/own-reports?outletId=${sampleOutletId}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
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
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }


  const totals = data.reduce(
    (acc, row) => {
      acc.sales += calculateTotalSales(
        row.saleCash,
        row.saleUpi,
        row.saleCredit
      );
      acc.expenses += row.expenses;
      acc.purchase += row.purchase;
      return acc;
    },
    { sales: 0, expenses: 0, purchase: 0 }
  );

  return (
    <>
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Outlet Reports
            </h1>
            <p className="text-gray-500 mt-1">
              Outlet Report - Last 30 days
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
            <CardTitle>Daily Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Date
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
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
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
