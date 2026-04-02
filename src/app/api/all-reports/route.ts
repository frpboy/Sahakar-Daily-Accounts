import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterOutletId = searchParams.get("outletId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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
        purchase: dailyAccounts.purchase,
        closingStock: dailyAccounts.closingStock,
      })
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id))
      .orderBy(desc(dailyAccounts.date));

    let conditions = [];

    if (filterOutletId && filterOutletId !== "all") {
      conditions.push(eq(dailyAccounts.outletId, filterOutletId));
    }

    if (startDate) {
      conditions.push(gte(dailyAccounts.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(dailyAccounts.date, endDate));
    }

    const entries =
      conditions.length > 0
        ? await query.where(and(...conditions)).limit(500)
        : await query.limit(500);

    const formattedEntries = entries.map((entry) => ({
      ...entry,
      saleCash: parseFloat(entry.saleCash || "0"),
      saleUpi: parseFloat(entry.saleUpi || "0"),
      saleCredit: parseFloat(entry.saleCredit || "0"),
      expenses: parseFloat(entry.expenses || "0"),
      purchase: parseFloat(entry.purchase || "0"),
      closingStock: parseFloat(entry.closingStock || "0"),
    }));

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error("All reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
