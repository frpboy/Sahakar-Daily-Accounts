"use server";

import { db } from "@/db";
import { dailyAccounts, outlets, users } from "@/db/schema";
import { dailyEntrySchema } from "@/lib/validations/entry";
import { revalidatePath } from "next/cache";
import { eq, and, between, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/actions/audit";
import { formatDateInput } from "@/lib/utils";

export async function submitDailyAccount(rawData: unknown) {
  try {
    // 1. Auth: get Supabase user and look up role/outlet from DB
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const userId = dbUser.id;
    const outletId = dbUser.outletId ?? undefined;
    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";

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

    // 4b. 31-day window enforcement for outlet_manager / outlet_accountant
    if (!isAdmin) {
      const entryDate = validatedData.date instanceof Date
        ? validatedData.date
        : new Date(validatedData.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 31);
      cutoff.setHours(0, 0, 0, 0);
      if (entryDate < cutoff) {
        return { success: false, error: "Cannot create or edit entries older than 31 days." };
      }
    }

    // 5. Format date for database in the business timezone
    const dateStr = formatDateInput(validatedData.date);

    // 6. Determine create vs update for audit
    const existing = await db
      .select()
      .from(dailyAccounts)
      .where(
        and(
          eq(dailyAccounts.outletId, targetOutletId),
          eq(dailyAccounts.date, dateStr)
        )
      )
      .limit(1);

    const isUpdate = existing.length > 0;

    // 7. Database Upsert (Insert or Update)
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

    // 8. Log audit event
    await logAudit({
      userId,
      userName: dbUser.name,
      action: isUpdate ? "update" : "create",
      entityType: "daily_account",
      entityId: `${targetOutletId}:${dateStr}`,
      oldData: isUpdate ? (existing[0] as Record<string, unknown>) : undefined,
      newData: {
        outletId: targetOutletId,
        date: dateStr,
        saleCash: validatedData.saleCash,
        saleUpi: validatedData.saleUpi,
        saleCredit: validatedData.saleCredit,
        saleReturn: validatedData.saleReturn,
        expenses: validatedData.expenses,
        purchase: validatedData.purchase,
        closingStock: validatedData.closingStock,
      },
    });

    // 9. Clear Cache so the UI updates
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
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";
    const outletId = dbUser.outletId ?? undefined;

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
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";
    const outletId = dbUser.outletId ?? undefined;

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

export async function getEntryByDateAndOutlet(date: string, outletId: string) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";

    // Non-admins can only fetch their own outlet's entries
    if (!isAdmin && dbUser.outletId !== outletId) {
      return { success: false, error: "Forbidden" };
    }

    const [entry] = await db
      .select()
      .from(dailyAccounts)
      .where(and(eq(dailyAccounts.date, date), eq(dailyAccounts.outletId, outletId)))
      .limit(1);

    return { success: true, data: entry ?? null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMyProfile() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db
      .select({
        id: users.id,
        role: users.role,
        outletId: users.outletId,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!dbUser) return { success: false, error: "User not found" };
    return { success: true, data: dbUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDailyAccount(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const role = dbUser.role;
    const isAdmin = role === "admin" || role === "ho_accountant";
    const isOutletLevel = role === "outlet_manager" || role === "outlet_accountant";

    if (!isAdmin && !isOutletLevel) return { success: false, error: "Forbidden" };

    const [entry] = await db
      .select()
      .from(dailyAccounts)
      .where(eq(dailyAccounts.id, id))
      .limit(1);

    if (!entry) return { success: false, error: "Entry not found" };

    // outlet_manager / outlet_accountant: own outlet only, within 31 days
    if (isOutletLevel) {
      if (entry.outletId !== dbUser.outletId) {
        return { success: false, error: "You can only delete entries for your own outlet" };
      }
      const entryDate = new Date(entry.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 31);
      cutoff.setHours(0, 0, 0, 0);
      if (entryDate < cutoff) {
        return { success: false, error: "Cannot delete entries older than 31 days" };
      }
    }

    await db.delete(dailyAccounts).where(eq(dailyAccounts.id, id));

    await logAudit({
      userId: dbUser.id,
      userName: dbUser.name,
      action: "delete",
      entityType: "daily_account",
      entityId: id,
      oldData: entry as Record<string, unknown>,
    });

    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { success: true, message: "Entry deleted successfully" };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllOutlets() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";

    if (!isAdmin) {
      // Return only the user's own outlet
      if (!dbUser.outletId) return { success: true, data: [] };
      const result = await db
        .select()
        .from(outlets)
        .where(eq(outlets.id, dbUser.outletId));
      return { success: true, data: result };
    }

    const result = await db.select().from(outlets).orderBy(outlets.name);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getMonthlyAggregates(year: number, month: number) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";
    if (!isAdmin) return { success: false, error: "Forbidden" };

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
