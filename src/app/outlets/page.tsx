"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Building2 } from "lucide-react";
import Link from "next/link";

interface OutletStats {
  id: string;
  name: string;
  totalSales: number;
  totalExpenses: number;
  entriesCount: number;
}

export default function OutletsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [outlets, setOutlets] = useState<OutletStats[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "ho_accountant")) {
      fetchOutlets();
    }
  }, [user]);

  async function fetchOutlets() {
    try {
      const response = await fetch("/api/outlets-stats");
      if (response.ok) {
        const data = await response.json();
        setOutlets(data);
      }
    } catch (error) {
      console.error("Failed to fetch outlets:", error);
    } finally {
      setIsDataLoading(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "ho_accountant") {
    router.push("/entry");
    return null;
  }

  return (
    <>
      <TopNav />
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Outlets</h1>
          <p className="text-gray-500 mt-1">
            View performance across all branches
          </p>
        </div>

        {isDataLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {outlets.map((outlet) => (
              <Link key={outlet.id} href={`/outlets/${outlet.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{outlet.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Total Sales
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(outlet.totalSales)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Total Expenses
                        </span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(outlet.totalExpenses)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Entries</span>
                        <span className="font-semibold">
                          {outlet.entriesCount}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Net Profit
                          </span>
                          <span
                            className={`font-bold ${
                              outlet.totalSales - outlet.totalExpenses >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(
                              outlet.totalSales - outlet.totalExpenses
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
