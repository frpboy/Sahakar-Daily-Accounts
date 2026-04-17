import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { getAuthenticatedUser, isAdminOrHO, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();
    if (!isAdminOrHO(user.role)) return forbidden();

    const { searchParams } = new URL(request.url);
    const filterOutletId = searchParams.get("outletId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeAll = searchParams.get("includeAll") === "true";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "50")));

    const conditions = [];

    if (filterOutletId && filterOutletId !== "all") {
      conditions.push(eq(dailyAccounts.outletId, filterOutletId));
    }

    if (startDate) {
      conditions.push(gte(dailyAccounts.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(dailyAccounts.date, endDate));
    }

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(dailyAccounts);

    const totalResult =
      conditions.length > 0
        ? await countQuery.where(and(...conditions))
        : await countQuery;
    const total = Number(totalResult[0]?.count || 0);
    const totalPages = includeAll ? 1 : Math.max(1, Math.ceil(total / pageSize));
    const safePage = includeAll ? 1 : Math.min(page, totalPages);
    const offset = includeAll ? 0 : (safePage - 1) * pageSize;

    let query = db
      .select({
        id: dailyAccounts.id,
        date: dailyAccounts.date,
        outletId: dailyAccounts.outletId,
        outletName: outlets.name,
        saleCash: dailyAccounts.saleCash,
        saleUpi: dailyAccounts.saleUpi,
        saleCredit: dailyAccounts.saleCredit,
        expenses: dailyAccounts.expenses,
        expenseBreakdown: dailyAccounts.expenseBreakdown,
        purchase: dailyAccounts.purchase,
        closingStock: dailyAccounts.closingStock,
      })
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id))
      .orderBy(desc(dailyAccounts.date));

    const entries =
      conditions.length > 0
        ? await query.where(and(...conditions)).limit(includeAll ? total || 1 : pageSize).offset(offset)
        : await query.limit(includeAll ? total || 1 : pageSize).offset(offset);

    const formattedEntries = entries.map((entry) => ({
      ...entry,
      saleCash: parseFloat(entry.saleCash || "0"),
      saleUpi: parseFloat(entry.saleUpi || "0"),
      saleCredit: parseFloat(entry.saleCredit || "0"),
      expenses: parseFloat(entry.expenses || "0"),
      expenseBreakdown: Array.isArray(entry.expenseBreakdown)
        ? entry.expenseBreakdown
        : [],
      purchase: parseFloat(entry.purchase || "0"),
      closingStock: parseFloat(entry.closingStock || "0"),
    }));

    return NextResponse.json({
      data: formattedEntries,
      pagination: {
        page: safePage,
        pageSize: includeAll ? formattedEntries.length : pageSize,
        total,
        totalPages,
        hasPreviousPage: safePage > 1,
        hasNextPage: safePage < totalPages,
      },
    });
  } catch (error) {
    console.error("All reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
