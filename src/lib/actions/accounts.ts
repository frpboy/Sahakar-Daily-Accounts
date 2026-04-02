"use server";

import { db } from "@/db";
import { dailyAccounts, outlets } from "@/db/schema";
import { dailyEntrySchema } from "@/lib/validations/entry";
import { revalidatePath } from "next/cache";
import { eq, and, between, sql } from "drizzle-orm";
import { logAction } from "./audit";
import { sendNotification } from "./notifications";

export async function submitDailyAccount(rawData: unknown) {
  try {
    // 1. Validation Proxy (Bypassing session context)
    const userId = "admin-user";
    const outletId = undefined;
    const isAdmin = true;

    // 2. Validate Data with Zod
    const validatedData = dailyEntrySchema.parse(rawData);

    // 3. Security Enforcement: Force the outletId if the user is a manager
    const targetOutletId = isAdmin ? validatedData.outletId : outletId;

    if (!targetOutletId) {
      return { success: false, error: "No outlet assigned to user." };
    }

    // 4. Verify outlet exists
    const outletExists = await db
      .select()
      .from(outlets)
      .where(eq(outlets.id, targetOutletId))
      .limit(1);

    if (outletExists.length === 0) {
      return { success: false, error: "Invalid outlet selected." };
    }

    // 5. Format date for database
    const dateStr = validatedData.date.toISOString().split("T")[0];

    // 6. Database Upsert (Insert or Update)
    await db
      .insert(dailyAccounts)
      .values({
        date: dateStr,
        outletId: targetOutletId,
        saleCash: validatedData.saleCash.toString(),
        saleUpi: validatedData.saleUpi.toString(),
        saleCredit: validatedData.saleCredit.toString(),
        saleReturn: validatedData.saleReturn.toString(),
        expenses: validatedData.expenses.toString(),
        purchase: validatedData.purchase.toString(),
        closingStock: validatedData.closingStock.toString(),
        createdBy: userId,
      })
      .onConflictDoUpdate({
        target: [dailyAccounts.date, dailyAccounts.outletId],
        set: {
          saleCash: validatedData.saleCash.toString(),
          saleUpi: validatedData.saleUpi.toString(),
          saleCredit: validatedData.saleCredit.toString(),
          saleReturn: validatedData.saleReturn.toString(),
          expenses: validatedData.expenses.toString(),
          purchase: validatedData.purchase.toString(),
          closingStock: validatedData.closingStock.toString(),
          updatedAt: new Date(),
        },
      });

    // 7. Success! Audit and Notify
    const outletName = outletExists[0].name;

    await logAction(
      "UPDATE",
      "daily_accounts",
      targetOutletId,
      validatedData,
      undefined
    );

    await sendNotification({
      type: "success",
      title: "Daily Account Submitted",
      message: `${outletName} has submitted their accounts for ${dateStr}.`,
      link: `/reports?outlet=${targetOutletId}&date=${dateStr}`,
    });

    // 8. Clear Cache so the UI updates
    revalidatePath("/entry");
    revalidatePath("/reports");
    revalidatePath("/dashboard");

    return { success: true, message: "Entry saved successfully!" };
  } catch (error: any) {
    console.error("Submission Error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors.map((e: any) => e.message).join(", "),
      };
    }

    return { success: false, error: "Database error. Please try again later." };
  }
}

export async function getDailyEntries(
  _filterDate?: string,
  filterOutletId?: string
) {
  try {
    // const { isAdmin, outletId } = await getSessionContext();
    const isAdmin = true;
    const outletId = undefined;

    const query = db
      .select()
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id));

    // Build WHERE conditions
    const conditions = [];

    if (!isAdmin) {
      // Managers can only see their own outlet
      if (!outletId) throw new Error("Manager has no assigned outlet");
      conditions.push(eq(dailyAccounts.outletId, outletId));
    } else if (filterOutletId) {
      // Admins can filter by outlet
      conditions.push(eq(dailyAccounts.outletId, filterOutletId));
    }

    // Apply all conditions
    const finalQuery =
      conditions.length > 0 ? query.where(and(...conditions)) : query;

    const result = await finalQuery.orderBy(dailyAccounts.date);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getDailyEntriesForLastDays(days: number = 7) {
  try {
    // const { isAdmin, outletId } = await getSessionContext();
    const isAdmin = true;
    const outletId = undefined;

    // if (!isAdmin && !outletId) {
    //   throw new Error("Manager has no assigned outlet");
    // }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = new Date().toISOString().split("T")[0];

    const conditions = [between(dailyAccounts.date, startDateStr, endDateStr)];

    if (!isAdmin) {
      conditions.push(eq(dailyAccounts.outletId, outletId!));
    }

    const result = await db
      .select()
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id))
      .where(and(...conditions))
      .orderBy(dailyAccounts.date);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllOutlets() {
  try {
    const result = await db.select().from(outlets).orderBy(outlets.name);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getMonthlyAggregates(year: number, month: number) {
  try {
    // Verification bypass

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const result = await db
      .select({
        outletId: dailyAccounts.outletId,
        outletName: outlets.name,
        totalSales: sql<number>`SUM(CAST(${dailyAccounts.saleCash} AS DECIMAL) + CAST(${dailyAccounts.saleUpi} AS DECIMAL) + CAST(${dailyAccounts.saleCredit} AS DECIMAL))`,
        totalExpenses: sql<number>`SUM(CAST(${dailyAccounts.expenses} AS DECIMAL))`,
        totalPurchase: sql<number>`SUM(CAST(${dailyAccounts.purchase} AS DECIMAL))`,
        totalEntries: sql<number>`COUNT(*)`,
      })
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id))
      .where(between(dailyAccounts.date, startDateStr, endDateStr))
      .groupBy(dailyAccounts.outletId, outlets.name);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
}
