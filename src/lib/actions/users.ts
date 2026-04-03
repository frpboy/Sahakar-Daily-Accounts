"use server";

import { db } from "@/db";
import { users, registrationRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/actions/audit";

export async function getAllUsers() {
  try {
    const result = await db.query.users.findMany({
      with: {
        outlet: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Fetch users error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function getUserById(id: string) {
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        outlet: true,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Fetch user error:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";
  outletId?: string;
}

export async function createUser(input: CreateUserInput) {
  try {
    if (!input.name || !input.email || !input.role) {
      return { success: false, error: "Name, email, and role are required" };
    }

    if (
      (input.role === "outlet_manager" || input.role === "outlet_accountant") &&
      !input.outletId
    ) {
      return {
        success: false,
        error: "Outlet is required for outlet-level roles",
      };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const userId = nanoid();
    await db.insert(users).values({
      id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      outletId: input.outletId || null,
    });

    await logAudit({
      userId: authUser.id,
      action: "create",
      entityType: "user",
      entityId: userId,
      newData: {
        id: userId,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
        outletId: input.outletId || null,
      } as Record<string, unknown>,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

interface UpdateUserInput {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";
  outletId?: string;
  isActive: boolean;
}

export async function updateUser(input: UpdateUserInput) {
  try {
    if (!input.name || !input.email || !input.role) {
      return { success: false, error: "Name, email, and role are required" };
    }

    if (
      (input.role === "outlet_manager" || input.role === "outlet_accountant") &&
      !input.outletId
    ) {
      return {
        success: false,
        error: "Outlet is required for outlet-level roles",
      };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, input.id),
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    const emailConflict = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (emailConflict && emailConflict.id !== input.id) {
      return { success: false, error: "User with this email already exists" };
    }

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    await db
      .update(users)
      .set({
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
        outletId: input.outletId || null,
        isActive: input.isActive ? "true" : "false",
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.id));

    await logAudit({
      userId: authUser.id,
      action: "update",
      entityType: "user",
      entityId: input.id,
      oldData: existingUser as Record<string, unknown>,
      newData: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
        outletId: input.outletId || null,
        isActive: input.isActive,
      } as Record<string, unknown>,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(id: string) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    if (existingUser.role === "admin") {
      return { success: false, error: "Cannot delete admin user" };
    }

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    await db.delete(users).where(eq(users.id, id));

    await logAudit({
      userId: authUser.id,
      action: "delete",
      entityType: "user",
      entityId: id,
      oldData: existingUser as Record<string, unknown>,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function getRegistrationRequests() {
  try {
    const result = await db.query.registrationRequests.findMany({
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Fetch requests error:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}

export async function approveRequest(requestId: string, role: CreateUserInput["role"], outletId?: string) {
  try {
    const request = await db.query.registrationRequests.findFirst({
      where: (table, { eq }) => eq(table.id, requestId),
    });

    if (!request) return { success: false, error: "Request not found" };

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    // Create the user
    // We reuse logic from createUser or just call it directly if we could (but it's async)
    const userResult = await createUser({
      name: request.name,
      email: request.email,
      phone: request.phone ?? undefined,
      role,
      outletId
    });

    if (!userResult.success) return userResult;

    // Update request status
    await db
      .update(registrationRequests)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(registrationRequests.id, requestId));

    await logAudit({
      userId: authUser.id,
      action: "approve",
      entityType: "registration_request",
      entityId: requestId,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Request approved and user created" };
  } catch (error) {
    console.error("Approve request error:", error);
    return { success: false, error: "Failed to approve request" };
  }
}

export async function rejectRequest(requestId: string) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    await db
      .update(registrationRequests)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(registrationRequests.id, requestId));

    await logAudit({
      userId: authUser.id,
      action: "reject",
      entityType: "registration_request",
      entityId: requestId,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Request rejected" };
  } catch (error) {
    console.error("Reject request error:", error);
    return { success: false, error: "Failed to reject request" };
  }
}
