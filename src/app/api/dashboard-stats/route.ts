import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const totalOutlets = await db
      .select({ count: sql<number>`count(*)` })
      .from(outlets);
    const todayEntries = await db
      .select({ count: sql<number>`count(*)` })
      .from(dailyAccounts)
      .where(eq(dailyAccounts.date, today));

    const aggregates = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(CAST(${dailyAccounts.saleCash} AS DECIMAL) + CAST(${dailyAccounts.saleUpi} AS DECIMAL) + CAST(${dailyAccounts.saleCredit} AS DECIMAL)), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${dailyAccounts.expenses} AS DECIMAL)), 0)`,
      })
      .from(dailyAccounts);

    return NextResponse.json({
      totalOutlets: totalOutlets[0]?.count || 0,
      todayEntries: todayEntries[0]?.count || 0,
      totalSales: Number(aggregates[0]?.totalSales || 0),
      totalExpenses: Number(aggregates[0]?.totalExpenses || 0),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
