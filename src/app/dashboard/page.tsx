"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Building2, TrendingUp, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalOutlets: number;
  todayEntries: number;
  totalSales: number;
  totalExpenses: number;
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalOutlets: 0,
    todayEntries: 0,
    totalSales: 0,
    totalExpenses: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    try {
      const response = await fetch("/api/dashboard-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const isHO = user.role === "ho_accountant";
  const canSeeAll = isAdmin || isHO;

  return (
    <>
      <TopNav />
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {canSeeAll ? "Dashboard" : `Welcome, ${user.name}`}
          </h1>
          <p className="text-gray-500 mt-1">
            {canSeeAll
              ? "Overview of all outlets and performance"
              : `${user.outletName || "Your outlet"} - ${format(new Date(), "EEEE, MMMM d, yyyy")}`}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {canSeeAll ? "Total Outlets" : "Today's Status"}
                  </p>
                  <p className="text-2xl font-bold">
                    {canSeeAll
                      ? stats.totalOutlets
                      : stats.todayEntries > 0
                        ? "Submitted"
                        : "Pending"}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalSales)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Entries Today
                  </p>
                  <p className="text-2xl font-bold">{stats.todayEntries}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="/entry"
                className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold">New Entry</h3>
                <p className="text-sm text-gray-500">
                  Add today&apos;s daily account
                </p>
              </a>
              <a
                href={canSeeAll ? "/reports" : "/reports/own"}
                className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold">View Reports</h3>
                <p className="text-sm text-gray-500">
                  Check sales and expenses
                </p>
              </a>
              {canSeeAll && (
                <a
                  href="/admin/users"
                  className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-gray-500">
                    Add or edit user accounts
                  </p>
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{format(new Date(), "EEEE")} Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Sales</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(stats.totalSales)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(stats.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Net Profit</span>
                  <span
                    className={`font-bold ${stats.totalSales - stats.totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(stats.totalSales - stats.totalExpenses)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
