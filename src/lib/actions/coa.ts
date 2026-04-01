"use server";

import { db } from "@/db";
import {
  accountCategories,
  accountGroups,
  chartOfAccounts,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

/**
 * Fetch all account categories with their groups and accounts nested
 */
export async function getFullChartOfAccounts() {
  try {
    const categories = await db.query.accountCategories.findMany({
      with: {
        groups: {
          with: {
            accounts: true,
            childGroups: {
              with: {
                accounts: true,
              },
            },
          },
        },
      },
      orderBy: [accountCategories.name],
    });

    return { success: true, data: categories };
  } catch (error: any) {
    console.error("Fetch CoA Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch flat categories for dropdowns
 */
export async function getAccountCategories() {
  try {
    const categories = await db.select().from(accountCategories).orderBy(accountCategories.name);
    return { success: true, data: categories };
  } catch (error: any) {
    console.error("Fetch Categories Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch groups for a category or parent group
 */
export async function getAccountGroups(categoryId?: string, parentGroupId?: string) {
  try {
    const conditions = [];
    if (categoryId) conditions.push(eq(accountGroups.categoryId, categoryId));
    if (parentGroupId) conditions.push(eq(accountGroups.parentGroupId, parentGroupId));

    const query = db.select().from(accountGroups);
    const finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;
    
    const result = await finalQuery.orderBy(accountGroups.name);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Fetch Groups Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new account group
 */
export async function createAccountGroup(data: {
  name: string;
  categoryId: string;
  parentGroupId?: string | null;
}) {
  try {
    const [newGroup] = await db.insert(accountGroups).values({
      name: data.name,
      categoryId: data.categoryId,
      parentGroupId: data.parentGroupId || null,
    }).returning();

    revalidatePath("/accounts/chart-of-accounts");
    return { success: true, data: newGroup };
  } catch (error: any) {
    console.error("Create Group Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new account in the chart of accounts
 */
export async function createChartOfAccount(data: {
  code: string;
  name: string;
  groupId: string;
  description?: string;
}) {
  try {
    const [newAccount] = await db.insert(chartOfAccounts).values({
      code: data.code,
      name: data.name,
      groupId: data.groupId,
      description: data.description,
    }).returning();

    revalidatePath("/accounts/chart-of-accounts");
    return { success: true, data: newAccount };
  } catch (error: any) {
    console.error("Create Account Error:", error);
    return { success: false, error: error.message };
  }
}
