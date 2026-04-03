"use client";

import { useEffect, useState, use } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, calculateTotalSales, calculateProfit } from "@/lib/utils";
import { Building2, Calendar, TrendingUp, IndianRupee, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface OutletStats {
  id: string;
  name: string;
  totalSales: number;
  totalExpenses: number;
  entriesCount: number;
}

interface ReportEntry {
  id: string;
  date: string;
  saleCash: number;
  saleUpi: number;
  saleCredit: number;
  expenses: number;
  purchase: number;
  closingStock: number;
}

export default function OutletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const outletId = resolvedParams.id;
  
  const [stats, setStats] = useState<OutletStats | null>(null);
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"summary" | "monthly" | "annual">("summary");

  useEffect(() => {
    fetchOutletData();
  }, [outletId]);

  async function fetchOutletData() {
    try {
      setIsLoading(true);
      
      // Fetch stats and all entries in parallel
      const [statsRes, entriesRes] = await Promise.all([
        fetch("/api/outlets-stats"),
        fetch(`/api/all-reports?outletId=${outletId}`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const outletStats = statsData.find((s: any) => s.id === outletId);
        setStats(outletStats || null);
      }

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      }
    } catch (error) {
      console.error("Failed to fetch outlet details:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Data aggregations
  const monthlyData = entries.reduce((acc: any[], entry) => {
    const monthYear = format(new Date(entry.date), "MMM yyyy");
    const existing = acc.find(m => m.period === monthYear);
    
    if (existing) {
      existing.saleCash += Number(entry.saleCash);
      existing.saleUpi += Number(entry.saleUpi);
      existing.saleCredit += Number(entry.saleCredit);
      existing.expenses += Number(entry.expenses);
      existing.purchase += Number(entry.purchase);
      existing.count += 1;
    } else {
      acc.push({
        period: monthYear,
        saleCash: Number(entry.saleCash),
        saleUpi: Number(entry.saleUpi),
        saleCredit: Number(entry.saleCredit),
        expenses: Number(entry.expenses),
        purchase: Number(entry.purchase),
        count: 1
      });
    }
    return acc;
  }, []);

  const annualData = entries.reduce((acc: any[], entry) => {
    const year = format(new Date(entry.date), "yyyy");
    const existing = acc.find(y => y.period === year);
    
    if (existing) {
      existing.saleCash += Number(entry.saleCash);
      existing.saleUpi += Number(entry.saleUpi);
      existing.saleCredit += Number(entry.saleCredit);
      existing.expenses += Number(entry.expenses);
      existing.purchase += Number(entry.purchase);
      existing.count += 1;
    } else {
      acc.push({
        period: year,
        saleCash: Number(entry.saleCash),
        saleUpi: Number(entry.saleUpi),
        saleCredit: Number(entry.saleCredit),
        expenses: Number(entry.expenses),
        purchase: Number(entry.purchase),
        count: 1
      });
    }
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Container className="py-12 text-center">
          <h2 className="text-2xl font-bold">Outlet not found</h2>
          <Link href="/outlets" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Outlets
          </Link>
      </Container>
  );
}

  const currentDisplayData = 
    viewMode === "summary" ? entries : 
    viewMode === "monthly" ? monthlyData : 
    annualData;

  return (
    <Container className="py-8">
        <Link href="/outlets" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 group">
          <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to All Outlets
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{stats.name}</h1>
              <p className="text-gray-500">Branch Performance Overview</p>
            </div>
          </div>
          <div className="p-1 bg-gray-100 rounded-lg flex gap-1">
             <button 
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === "summary" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
             >Summary</button>
             <button 
              onClick={() => setViewMode("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === "monthly" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
             >Monthly</button>
             <button 
              onClick={() => setViewMode("annual")}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === "annual" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
             >Annual</button>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-none shadow-sm bg-blue-50/50 hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-red-50/50 hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <IndianRupee className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-green-50/50 hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Net Profit</p>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {formatCurrency(stats.totalSales - stats.totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gray-50/80 hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">{viewMode === "summary" ? "Avg Sale/Entry" : "Entry Count"}</p>
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {viewMode === "summary" ? 
                  formatCurrency(stats.entriesCount > 0 ? (stats.totalSales / stats.entriesCount) : 0) :
                  stats.entriesCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-bold">
                {viewMode === "summary" ? "Recent Historical Entries" : 
                 viewMode === "monthly" ? "Monthly Performance Breakdown" : 
                 "Annual Financial Summary"}
              </CardTitle>
              <div className="text-xs font-mono font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">
                {currentDisplayData.length} {viewMode === "summary" ? "RECORDS" : viewMode === "monthly" ? "MONTHS" : "YEARS"} TOTAL
              </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/30 text-[11px] uppercase tracking-wider text-gray-400 font-bold border-b">
                    <th className="px-6 py-4">{viewMode === "summary" ? "Date" : "Period"}</th>
                    <th className="px-6 py-4 text-right">Cash</th>
                    <th className="px-6 py-4 text-right">UPI</th>
                    <th className="px-6 py-4 text-right font-bold text-gray-900">Total Sale</th>
                    <th className="px-6 py-4 text-right">Expenses</th>
                    <th className="px-6 py-4 text-right">Purchase</th>
                    <th className="px-6 py-4 text-right text-gray-900">Drip Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentDisplayData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No records found.</td>
                    </tr>
                  ) : (
                    currentDisplayData.map((item, idx) => {
                      const dateOrPeriod = viewMode === "summary" ? format(new Date(item.date), "dd MMM yyyy") : item.period;
                      const totalSale = calculateTotalSales(item.saleCash, item.saleUpi, item.saleCredit);
                      const profit = calculateProfit(totalSale, item.expenses, item.purchase);
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-sm">
                            {dateOrPeriod}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-gray-500">
                            {formatCurrency(item.saleCash)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-gray-500">
                            {formatCurrency(item.saleUpi)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold font-mono text-gray-900">
                            {formatCurrency(totalSale)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-red-500">
                            {formatCurrency(item.expenses)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-gray-500">
                            {formatCurrency(item.purchase)}
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-bold font-mono ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
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

