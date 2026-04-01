"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import {
  formatCurrency,
  calculateTotalSales,
  calculateProfit,
} from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF } from "@/lib/export";
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
  const [data, setData] = useState<ReportEntry[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedOutletId, startDate, endDate]);

  async function fetchData() {
    setIsDataLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOutletId && selectedOutletId !== "all") {
        params.set("outletId", selectedOutletId);
      }
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

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
    const exportData = data.map(row => {
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
        Profit: calculateProfit(total, row.expenses, row.purchase)
      };
    });
    exportToCSV(exportData, `Sahakar_Reports_${selectedOutletId}_${format(new Date(), "yyyyMMdd")}`);
  }

  function handleExportPDF() {
    exportToPDF("reports-table-container", `Sahakar Financial Report - ${selectedOutletId === 'all' ? 'All Outlets' : data[0]?.outletName || ''}`);
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
                  onValueChange={setSelectedOutletId}
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
                  onChange={(e) => setStartDate(e.target.value)}
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
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700"
                />
              </div>

              {(selectedOutletId !== "all" || startDate || endDate) && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSelectedOutletId("all");
                    setStartDate("");
                    setEndDate("");
                  }}
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
            <CardTitle>All Entries ({data.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0" id="reports-table-container">
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
  );
}
