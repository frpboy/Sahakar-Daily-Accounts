import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { users, dailyAccounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function AdminOverviewPage() {
  const { data: sessionData } = await auth.getSession();
  const user = sessionData?.user;

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Get user role from our DB
  const userProfile = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  });

  if (userProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  const reports = await db.query.dailyAccounts.findMany({
    orderBy: [desc(dailyAccounts.date)],
    with: {
      outlet: true
    }
  });

  return (
    <>
      <TopNav isAdmin={true} />
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">Admin Overview</h1>
            <p className="text-gray-500">Consolidated reports from all outlets</p>
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
                  <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Outlet</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Cash</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">UPI</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Credit</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Total Sale</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No reports submitted yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const totalSale = Number(report.saleCash) + Number(report.saleUpi) + Number(report.saleCredit);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {format(new Date(report.date), "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{report.outlet.name}</td>
                        <td className="px-6 py-4 text-right text-gray-600 font-mono">₹{report.saleCash}</td>
                        <td className="px-6 py-4 text-right text-gray-600 font-mono">₹{report.saleUpi}</td>
                        <td className="px-6 py-4 text-right text-gray-600 font-mono">₹{report.saleCredit}</td>
                        <td className="px-6 py-4 text-right text-indigo-600 font-bold font-mono">₹{totalSale.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-red-500 font-mono">₹{report.expenses}</td>
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
