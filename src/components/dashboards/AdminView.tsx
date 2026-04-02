"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Settings,
  Activity,
  FileText,
  Printer,
  Plus,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { DateRangeFilter } from "@/components/shared/DateRangeFilter";
import { subDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OutletCreationModal } from "@/components/shared/OutletCreationModal";

interface DashboardStats {
  totalOutlets: number;
  todayEntries: number;
  totalSales: number;
  totalExpenses: number;
  outletsStatus: Array<{
    id: string;
    code: string;
    name: string;
    isSubmitted: boolean;
    submittedAt: string | null;
  }>;
}

export default function AdminView() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOutlets: 0,
    todayEntries: 0,
    totalSales: 0,
    totalExpenses: 0,
    outletsStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [creationModal, setCreationModal] = useState<{
    type: "Hyper Pharmacy" | "Smart Clinic";
    isOpen: boolean;
  }>({
    type: "Hyper Pharmacy",
    isOpen: false,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from)
        params.append("from", dateRange.from.toISOString().split("T")[0]);
      if (dateRange.to)
        params.append("to", dateRange.to.toISOString().split("T")[0]);

      const response = await fetch(`/api/dashboard-stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleExportCSV = () => {
    const exportData = stats.outletsStatus.map((outlet) => ({
      Code: outlet.code,
      Name: outlet.name,
      Status: outlet.isSubmitted ? "Submitted" : "Pending",
      Time: outlet.submittedAt
        ? new Date(outlet.submittedAt).toLocaleString()
        : "N/A",
    }));
    exportToCSV(
      exportData,
      `Sahakar_Outlet_Status_${new Date().toISOString().split("T")[0]}`
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      "submission-tracker-table",
      "Sahakar Outlet Submission Tracker"
    );
  };

  return (
    <Container className="py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
            Admin Console
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
            Enterprise-wide performance and system oversight
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <DateRangeFilter
            onRangeChange={(from, to) => setDateRange({ from, to })}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-none">
                <Plus className="mr-2 h-3 w-3" /> Create Outlet{" "}
                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() =>
                  setCreationModal({ type: "Hyper Pharmacy", isOpen: true })
                }
                className="flex items-center gap-3 p-3 font-bold text-[10px] uppercase tracking-wider"
              >
                <div className="h-6 w-6 bg-gray-900 text-white rounded-none flex items-center justify-center">
                  <Building2 className="h-3 w-3" />
                </div>
                Hyper Pharmacy
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setCreationModal({ type: "Smart Clinic", isOpen: true })
                }
                className="flex items-center gap-3 p-3 font-bold text-[10px] uppercase tracking-wider"
              >
                <div className="h-6 w-6 bg-gray-900 text-white rounded-none flex items-center justify-center">
                  <Activity className="h-3 w-3" />
                </div>
                Smart Clinic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/admin/users" className="hidden lg:block">
            <Button
              variant="outline"
              className="h-10 px-6 font-black text-[10px] uppercase tracking-widest"
            >
              <Users className="mr-2 h-3.5 w-3.5 text-gray-400" /> People
            </Button>
          </Link>
          <Link href="/admin/settings" className="hidden lg:block">
            <Button
              variant="outline"
              className="h-10 px-6 font-black text-[10px] uppercase tracking-widest"
            >
              <Settings className="mr-2 h-3.5 w-3.5 text-gray-400" /> Settings
            </Button>
          </Link>
        </div>
      </div>

      <OutletCreationModal
        type={creationModal.type}
        isOpen={creationModal.isOpen}
        onClose={() => setCreationModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={fetchDashboardData}
      />

      {/* Main KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPIItem
          title="Total Outlets"
          value={stats.totalOutlets.toString()}
          icon={<Building2 className="h-4 w-4 text-gray-900" />}
          bg="bg-gray-100"
          sub="Active Units"
        />
        <KPIItem
          title="Revenue"
          value={formatCurrency(stats.totalSales)}
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          bg="bg-emerald-50"
          sub="Selected Range"
          isSuccess
        />
        <KPIItem
          title="Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={<DollarSign className="h-4 w-4 text-red-500" />}
          bg="bg-red-50"
          sub="Operational Costs"
          isDanger
        />
        <KPIItem
          title="Entries"
          value={stats.todayEntries.toString()}
          icon={<Activity className="h-4 w-4 text-blue-500" />}
          bg="bg-blue-50"
          sub="Today's Submits"
        />
      </div>

      {/* Grid of Outlets (Submission Status) */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b py-3 px-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between text-gray-500">
            <div className="flex items-center gap-2">
              Outlet Submission Tracker
              <span className="text-[9px] font-bold text-gray-400 opacity-50 px-2 py-0.5 border border-gray-200">
                LIVE
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                className="h-7 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 border border-gray-100 bg-white px-3"
              >
                <FileText className="h-3 w-3 mr-1.5" /> CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPDF}
                className="h-7 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 border border-gray-100 bg-white px-3"
              >
                <Printer className="h-3 w-3 mr-1.5" /> PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6" id="submission-tracker-table">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.outletsStatus.map((outlet) => (
              <Link key={outlet.id} href={`/outlets/${outlet.id}`}>
                <div className="flex flex-col gap-2 p-3 border border-gray-100 rounded-none bg-white hover:border-gray-900 transition-all group cursor-pointer h-full">
                  <div className="flex justify-between items-center">
                    <div
                      className={`h-1.5 w-1.5 rounded-none ${outlet.isSubmitted ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    <p className="text-[9px] font-black text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-widest">
                      {outlet.code}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-[11px] leading-tight uppercase tracking-wide truncate">
                      {outlet.name}
                    </p>
                  </div>
                  <div className="pt-2 mt-auto border-t border-gray-50 text-[9px] font-black text-gray-300 group-hover:text-gray-900 uppercase tracking-widest truncate transition-colors">
                    {outlet.isSubmitted
                      ? `@ ${new Date(outlet.submittedAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`
                      : "PENDING"}
                  </div>
                </div>
              </Link>
            ))}
            {stats.outletsStatus.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-gray-300 text-[10px] uppercase tracking-[0.3em] font-black">
                No operational reports found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

function KPIItem({
  title,
  value,
  icon,
  bg,
  sub,
  isSuccess,
  isDanger,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  sub: string;
  isSuccess?: boolean;
  isDanger?: boolean;
}) {
  return (
    <Card className="border border-gray-200 shadow-none rounded-none bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
              {title}
            </p>
            <div className={`p-2 ${bg} rounded-none`}>{icon}</div>
          </div>
          <div>
            <p
              className={`text-2xl font-black tracking-tighter font-mono ${isSuccess ? "text-emerald-500" : isDanger ? "text-red-500" : "text-gray-900"}`}
            >
              {value}
            </p>
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">
              {sub}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
