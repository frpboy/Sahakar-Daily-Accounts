"use client";

import { useEffect, useState } from "react";
import { getDailyEntries, getAllOutlets } from "@/lib/actions/accounts";
import { TopNav } from "@/components/shared/TopNav";
import { Container } from "@/components/ui/container";
import { AccountsDataTable, DailyAccountRow } from "@/components/tables/AccountsDataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { calculateTotalSales, calculateProfit } from "@/lib/utils";

export default function ReportsPage() {
  const [data, setData] = useState<DailyAccountRow[]>([]);
  const [outlets, setOutlets] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [entriesResult, outletsResult] = await Promise.all([
          getDailyEntries(undefined, selectedOutletId || undefined),
          getAllOutlets(),
        ]);

        if (outletsResult.success && outletsResult.data) {
          setOutlets(
            outletsResult.data.map(o => ({ id: o.id, name: o.name }))
          );
        }

        if (entriesResult.success && entriesResult.data) {
          const transformedData: DailyAccountRow[] = entriesResult.data.map(
            (item: any) => {
              const cash = parseFloat(item.daily_accounts?.sale_cash || 0);
              const upi = parseFloat(item.daily_accounts?.sale_upi || 0);
              const credit = parseFloat(item.daily_accounts?.sale_credit || 0);
              const expenses = parseFloat(item.daily_accounts?.expenses || 0);
              const purchase = parseFloat(item.daily_accounts?.purchase || 0);
              const totalSales = calculateTotalSales(cash, upi, credit);
              const profit = calculateProfit(totalSales, expenses, purchase);

              return {
                id: item.daily_accounts?.id,
                date: item.daily_accounts?.date,
                outletName: item.outlets?.name,
                saleCash: cash,
                saleUpi: upi,
                saleCredit: credit,
                totalSales: totalSales,
                expenses: expenses,
                purchase: purchase,
                closingStock: parseFloat(item.daily_accounts?.closing_stock || 0),
                profit: profit,
              };
            }
          );
          setData(transformedData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedOutletId]);

  const handleExportCSV = () => {
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
    const rows = data.map((row) => [
      row.date,
      row.outletName,
      row.saleCash,
      row.saleUpi,
      row.saleCredit,
      row.totalSales,
      row.expenses,
      row.purchase,
      row.closingStock,
      row.profit,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <>
      <TopNav isAdmin={true} />
      <Container className="py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-2">
              View and analyze all outlet accounts
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Outlet
                </label>
                <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
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

              <Button
                onClick={handleExportCSV}
                disabled={data.length === 0}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Account Entries</CardTitle>
              <CardDescription>
                Total entries: {data.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountsDataTable data={data} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
