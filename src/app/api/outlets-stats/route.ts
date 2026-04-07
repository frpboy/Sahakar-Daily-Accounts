import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { getAuthenticatedUser, isAdminOrHO, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();
    if (!isAdminOrHO(user.role)) return forbidden();

    const outletsWithStats = await db
      .select({
        id: outlets.id,
        name: outlets.name,
        code: outlets.code,
        type: outlets.type,
        totalSales: sql<number>`COALESCE(SUM(CAST(${dailyAccounts.saleCash} AS DECIMAL) + CAST(${dailyAccounts.saleUpi} AS DECIMAL) + CAST(${dailyAccounts.saleCredit} AS DECIMAL)), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${dailyAccounts.expenses} AS DECIMAL)), 0)`,
        entriesCount: sql<number>`COUNT(${dailyAccounts.id})`,
      })
      .from(outlets)
      .leftJoin(dailyAccounts, eq(dailyAccounts.outletId, outlets.id))
      .groupBy(outlets.id, outlets.name, outlets.code, outlets.type)
      .orderBy(outlets.name);

    return NextResponse.json(outletsWithStats);
  } catch (error) {
    console.error("Outlets stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outlets" },
      { status: 500 }
    );
  }
}
