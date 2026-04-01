import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterOutletId = searchParams.get("outletId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Get current session context (hardcoded for now as per project state)
    const { role, outletId: sessionOutletId } = await getSessionContext();
    const isAdmin = role === "admin" || role === "ho_accountant";

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

    // RBAC Filter Logic
    let conditions = [];

    if (!isAdmin) {
      // Non-admins can ONLY see their assigned outlet
      if (!sessionOutletId) {
        return NextResponse.json({ error: "User has no assigned outlet" }, { status: 403 });
      }
      conditions.push(eq(dailyAccounts.outletId, sessionOutletId));
    } else if (filterOutletId && filterOutletId !== "all") {
      // Admins can filter by any outlet
      conditions.push(eq(dailyAccounts.outletId, filterOutletId));
    }

    // Date range filtering
    if (startDate) {
      conditions.push(gte(dailyAccounts.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(dailyAccounts.date, endDate));
    }

    const entries = conditions.length > 0 
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
