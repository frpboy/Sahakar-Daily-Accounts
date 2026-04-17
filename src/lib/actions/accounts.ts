"use server";

import { db } from "@/db";
import { dailyAccounts, outlets, users } from "@/db/schema";
import { dailyEntrySchema, DailyEntryInput } from "@/lib/validations/entry";
import { revalidatePath } from "next/cache";
import { eq, and, between, sql, desc } from "drizzle-orm";
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
    const expenseBreakdown = validatedData.expenseBreakdown ?? [];
    const normalizedBreakdown = expenseBreakdown
      .filter((item) => item.amount > 0)
      .map((item) => ({
        category: item.category,
        amount: Number(item.amount),
      }));
    const computedExpenses = normalizedBreakdown.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    let existingRecord: typeof dailyAccounts.$inferSelect | undefined;
    let savedEntryId = validatedData.entryId ?? "";
    const normalizedInput: DailyEntryInput = {
      ...validatedData,
      expenses: computedExpenses,
      expenseBreakdown,
    };

    const isUpdate = Boolean(validatedData.entryId);
    if (validatedData.entryId) {
      const [existingById] = await db
        .select()
        .from(dailyAccounts)
        .where(eq(dailyAccounts.id, validatedData.entryId))
        .limit(1);

      if (!existingById) {
        return { success: false, error: "Entry not found." };
      }

      if (!isAdmin && existingById.outletId !== dbUser.outletId) {
        return { success: false, error: "Forbidden" };
      }

      existingRecord = existingById;

      await db
        .update(dailyAccounts)
        .set({
          date: dateStr,
          outletId: targetOutletId,
          saleCash: normalizedInput.saleCash.toString(),
          saleUpi: normalizedInput.saleUpi.toString(),
          saleCredit: normalizedInput.saleCredit.toString(),
          saleReturn: normalizedInput.saleReturn.toString(),
          expenses: normalizedInput.expenses.toString(),
          purchase: normalizedInput.purchase.toString(),
          closingStock: normalizedInput.closingStock.toString(),
          expenseBreakdown: normalizedBreakdown,
          updatedAt: new Date(),
        })
        .where(eq(dailyAccounts.id, validatedData.entryId));
    } else {
      const inserted = await db
        .insert(dailyAccounts)
        .values({
          date: dateStr,
          outletId: targetOutletId,
          saleCash: normalizedInput.saleCash.toString(),
          saleUpi: normalizedInput.saleUpi.toString(),
          saleCredit: normalizedInput.saleCredit.toString(),
          saleReturn: normalizedInput.saleReturn.toString(),
          expenses: normalizedInput.expenses.toString(),
          purchase: normalizedInput.purchase.toString(),
          closingStock: normalizedInput.closingStock.toString(),
          expenseBreakdown: normalizedBreakdown,
          createdBy: userId,
        })
        .returning({ id: dailyAccounts.id });

      savedEntryId = inserted[0]?.id ?? "";
    }

    // 8. Log audit event
    await logAudit({
      userId,
      userName: dbUser.name,
      action: isUpdate ? "update" : "create",
      entityType: "daily_account",
      entityId: savedEntryId || `${targetOutletId}:${dateStr}`,
      oldData: isUpdate ? (existingRecord as Record<string, unknown>) : undefined,
      newData: {
        outletId: targetOutletId,
        date: dateStr,
        saleCash: normalizedInput.saleCash,
        saleUpi: normalizedInput.saleUpi,
        saleCredit: normalizedInput.saleCredit,
        saleReturn: normalizedInput.saleReturn,
        expenses: normalizedInput.expenses,
        purchase: normalizedInput.purchase,
        closingStock: normalizedInput.closingStock,
        expenseBreakdown: normalizedBreakdown,
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

    const startDateStr = formatDateInput(startDate);
    const endDateStr = formatDateInput(new Date());

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
      .orderBy(desc(dailyAccounts.createdAt))
      .limit(1);

    return { success: true, data: entry ?? null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEntryById(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";

    const [entry] = await db
      .select()
      .from(dailyAccounts)
      .where(eq(dailyAccounts.id, id))
      .limit(1);

    if (!entry) return { success: false, error: "Entry not found" };

    if (!isAdmin && dbUser.outletId !== entry.outletId) {
      return { success: false, error: "Forbidden" };
    }

    return { success: true, data: entry };
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

    const startDateStr = formatDateInput(startDate);
    const endDateStr = formatDateInput(endDate);

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
