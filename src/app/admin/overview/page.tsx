import { db } from "@/db";
import { dailyAccounts, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const [caller] = await db.select({ role: users.role }).from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!caller || (caller.role !== "admin" && caller.role !== "ho_accountant")) {
    redirect("/dashboard");
  }

  const reports = await db.query.dailyAccounts
    .findMany({
      orderBy: [desc(dailyAccounts.date)],
      with: {
        outlet: true,
      },
    })
    .catch((err) => {
      console.error("Dashboard database error:", err);
      return [];
    });

  return (
    <>
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">
              Admin Overview
            </h1>
            <p className="text-gray-500">
              Consolidated reports from all outlets
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-premium-lg bg-white/70 backdrop-blur-md">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg">Recent Daily Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/30">
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Outlet
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                    Cash
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                    UPI
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                    Credit
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                    Total Sale
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                    Expenses
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No reports submitted yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const totalSale =
                      Number(report.saleCash) +
                      Number(report.saleUpi) +
                      Number(report.saleCredit);
                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {format(new Date(report.date), "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {report.outlet.name}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                          ₹{report.saleCash}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                          ₹{report.saleUpi}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                          ₹{report.saleCredit}
                        </td>
                        <td className="px-6 py-4 text-right text-indigo-600 font-bold tabular-nums">
                          ₹{totalSale.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-red-500 tabular-nums">
                          ₹{report.expenses}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
