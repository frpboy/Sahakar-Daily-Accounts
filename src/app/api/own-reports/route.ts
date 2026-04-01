import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get("outletId");

    if (!outletId) {
      return NextResponse.json(
        { error: "Outlet ID required" },
        { status: 400 }
      );
    }

    const entries = await db
      .select({
        id: dailyAccounts.id,
        date: dailyAccounts.date,
        saleCash: dailyAccounts.saleCash,
        saleUpi: dailyAccounts.saleUpi,
        saleCredit: dailyAccounts.saleCredit,
        expenses: dailyAccounts.expenses,
        purchase: dailyAccounts.purchase,
        closingStock: dailyAccounts.closingStock,
      })
      .from(dailyAccounts)
      .where(eq(dailyAccounts.outletId, outletId))
      .orderBy(desc(dailyAccounts.date))
      .limit(30);

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
    console.error("Own reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
