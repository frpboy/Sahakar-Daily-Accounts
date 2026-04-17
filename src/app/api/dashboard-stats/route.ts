import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { getAuthenticatedUser, isAdminOrHO, unauthorized } from "@/lib/api-auth";
import { formatDateInput } from "@/lib/utils";

interface OutletStatus {
  id: string;
  code?: string | null;
  name: string;
  isSubmitted: boolean;
  submittedAt: string | Date | null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const today = formatDateInput(new Date());

    // For outlet-level roles, always use their assigned outlet — ignore client param
    const adminAccess = isAdminOrHO(user.role);
    const outletId = adminAccess
      ? searchParams.get("outletId")
      : user.outletId;

    // 1. Basic Counts
    let totalOutletsCount = 0;
    let todayEntriesCount = 0;

    if (outletId) {
      const counts = await db
        .select({
          todayEntries: sql<number>`count(*)`,
        })
        .from(dailyAccounts)
        .where(
          and(
            eq(dailyAccounts.outletId, outletId),
            eq(dailyAccounts.date, today)
          )
        );

      todayEntriesCount = Number(counts[0]?.todayEntries || 0);
      totalOutletsCount = 1;
    } else {
      const totalOutletsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(outlets);
      const todayEntriesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(dailyAccounts)
        .where(eq(dailyAccounts.date, today));
      totalOutletsCount = Number(totalOutletsResult[0]?.count || 0);
      todayEntriesCount = Number(todayEntriesResult[0]?.count || 0);
    }

    // 2. Financial Aggregates
    const conditions = [];
    if (outletId) conditions.push(eq(dailyAccounts.outletId, outletId));
    if (from) conditions.push(sql`date >= ${from}`);
    if (to) conditions.push(sql`date <= ${to}`);

    const aggregatesQuery = db
      .select({
        totalSales: sql<number>`COALESCE(SUM((sale_cash)::numeric + (sale_upi)::numeric + (sale_credit)::numeric), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM((expenses)::numeric), 0)`,
        saleCash: sql<number>`COALESCE(SUM((sale_cash)::numeric), 0)`,
        saleUpi: sql<number>`COALESCE(SUM((sale_upi)::numeric), 0)`,
        saleCredit: sql<number>`COALESCE(SUM((sale_credit)::numeric), 0)`,
      })
      .from(dailyAccounts);

    if (conditions.length > 0) {
      aggregatesQuery.where(and(...conditions));
    }

    const aggregates = await aggregatesQuery;

    // Get latest closing stock if outletId is provided
    let latestClosingStock = 0;
    if (outletId) {
      const closingStockConditions = [eq(dailyAccounts.outletId, outletId)];
      if (to) closingStockConditions.push(sql`date <= ${to}`);

      const latestEntry = await db
        .select({ closingStock: dailyAccounts.closingStock })
        .from(dailyAccounts)
        .where(and(...closingStockConditions))
        .orderBy(desc(dailyAccounts.date))
        .limit(1);

      latestClosingStock = Number(latestEntry[0]?.closingStock || 0);
    }

    // 3. Outlet Submission Status for Today
    let outletsStatus: OutletStatus[] = [];
    if (!outletId) {
      // Only admins reach here (outlet roles always have outletId)
      const allOutlets = await db.query.outlets.findMany({
        with: {
          dailyAccounts: {
            where: eq(dailyAccounts.date, today),
            limit: 1,
          },
        },
      });

      outletsStatus = allOutlets.map((outlet) => ({
        id: outlet.id,
        code: outlet.code,
        name: outlet.name,
        isSubmitted: outlet.dailyAccounts.length > 0,
        submittedAt: outlet.dailyAccounts[0]?.createdAt || null,
      }));
    } else {
      const outlet = await db.query.outlets.findFirst({
        where: eq(outlets.id, outletId),
        with: {
          dailyAccounts: {
            where: eq(dailyAccounts.date, today),
            limit: 1,
          },
        },
      });
      if (outlet) {
        outletsStatus = [
          {
            id: outlet.id,
            code: outlet.code,
            name: outlet.name,
            isSubmitted: outlet.dailyAccounts.length > 0,
            submittedAt: outlet.dailyAccounts[0]?.createdAt || null,
          },
        ];
      }
    }

    return NextResponse.json({
      totalOutlets: totalOutletsCount,
      todayEntries: todayEntriesCount,
      totalSales: Number(aggregates[0]?.totalSales || 0),
      totalExpenses: Number(aggregates[0]?.totalExpenses || 0),
      saleCash: Number(aggregates[0]?.saleCash || 0),
      saleUpi: Number(aggregates[0]?.saleUpi || 0),
      saleCredit: Number(aggregates[0]?.saleCredit || 0),
      closingStock: latestClosingStock,
      outletsStatus: outletsStatus,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
