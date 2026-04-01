import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get("outletId");

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
      .orderBy(desc(dailyAccounts.date))
      .limit(100);

    const entries = outletId
      ? await query.where(eq(dailyAccounts.outletId, outletId))
      : await query;

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
