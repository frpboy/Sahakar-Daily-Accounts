"use server";

import { db } from "@/db";
import { users, registrationRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/actions/audit";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type CallerRole = "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";

async function getCaller() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const [dbUser] = await db
    .select({ id: users.id, role: users.role, outletId: users.outletId, name: users.name })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  return dbUser ?? null;
}

function canManageUsers(role: CallerRole | null) {
  return role === "admin" || role === "outlet_manager";
}

function canViewUsers(role: CallerRole | null) {
  return role === "admin" || role === "ho_accountant" || role === "outlet_manager";
}

function createSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isSupabaseUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function getAllUsers() {
  try {
    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };
    if (!canViewUsers(caller.role as CallerRole)) return { success: false, error: "Forbidden" };

    if (caller.role === "outlet_manager") {
      // Only users in their outlet
      const result = await db.query.users.findMany({
        where: eq(users.outletId, caller.outletId!),
        with: { outlet: true },
        orderBy: (u, { desc }) => [desc(u.createdAt)],
      });
      return { success: true, data: result };
    }

    const result = await db.query.users.findMany({
      with: { outlet: true },
      orderBy: (u, { desc }) => [desc(u.createdAt)],
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Fetch users error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function getUserById(id: string) {
  try {
    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };
    if (!canViewUsers(caller.role as CallerRole)) return { success: false, error: "Forbidden" };

    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: { outlet: true },
    });

    if (!result) return { success: false, error: "User not found" };

    // outlet_manager can only view users in their outlet
    if (caller.role === "outlet_manager" && result.outletId !== caller.outletId) {
      return { success: false, error: "Forbidden" };
    }

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
      return { success: false, error: "Outlet is required for outlet-level roles" };
    }

    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };

    const callerRole = caller.role as CallerRole;

    if (!canManageUsers(callerRole)) {
      return { success: false, error: "Forbidden" };
    }

    // outlet_manager: can only create outlet_accountant for their own outlet
    if (callerRole === "outlet_manager") {
      if (input.role !== "outlet_accountant") {
        return { success: false, error: "Outlet managers can only create outlet accountant users" };
      }
      if (input.outletId !== caller.outletId) {
        return { success: false, error: "You can only create users for your own outlet" };
      }
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    const adminSupabase = createSupabaseAdmin();
    const inviteResult = await adminSupabase.auth.admin.inviteUserByEmail(input.email, {
      data: { name: input.name },
    });

    if (inviteResult.error || !inviteResult.data.user) {
      return {
        success: false,
        error: inviteResult.error?.message || "Failed to provision auth user",
      };
    }

    const userId = inviteResult.data.user.id;
    await db.insert(users).values({
      id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      outletId: input.outletId || null,
    });

    await logAudit({
      userId: caller.id,
      userName: caller.name,
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
    return { success: true, message: "User created and invite sent successfully" };
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
      return { success: false, error: "Outlet is required for outlet-level roles" };
    }

    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };

    const callerRole = caller.role as CallerRole;
    if (!canManageUsers(callerRole)) return { success: false, error: "Forbidden" };

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, input.id),
    });

    if (!existingUser) return { success: false, error: "User not found" };

    // outlet_manager: can only edit outlet_accountant users in their own outlet
    if (callerRole === "outlet_manager") {
      if (existingUser.outletId !== caller.outletId) {
        return { success: false, error: "You can only edit users in your own outlet" };
      }
      if (existingUser.role !== "outlet_accountant") {
        return { success: false, error: "Outlet managers can only edit outlet accountant users" };
      }
      // Prevent changing role or outlet
      if (input.role !== "outlet_accountant" || input.outletId !== caller.outletId) {
        return { success: false, error: "You cannot change the role or outlet of this user" };
      }
    }

    const emailConflict = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (emailConflict && emailConflict.id !== input.id) {
      return { success: false, error: "User with this email already exists" };
    }

    if (isSupabaseUuid(input.id)) {
      const adminSupabase = createSupabaseAdmin();
      const authUpdate = await adminSupabase.auth.admin.updateUserById(input.id, {
        email: input.email,
        user_metadata: { name: input.name },
      });

      if (authUpdate.error) {
        return {
          success: false,
          error: `Failed to update auth user: ${authUpdate.error.message}`,
        };
      }
    }

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
      userId: caller.id,
      userName: caller.name,
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
    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };

    const callerRole = caller.role as CallerRole;
    if (!canManageUsers(callerRole)) return { success: false, error: "Forbidden" };

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) return { success: false, error: "User not found" };

    // Nobody can delete an admin
    if (existingUser.role === "admin") {
      return { success: false, error: "Cannot delete admin user" };
    }

    // outlet_manager: can only delete outlet_accountant in their own outlet
    if (callerRole === "outlet_manager") {
      if (existingUser.outletId !== caller.outletId) {
        return { success: false, error: "You can only delete users in your own outlet" };
      }
      if (existingUser.role !== "outlet_accountant") {
        return { success: false, error: "Outlet managers can only delete outlet accountant users" };
      }
    }

    if (isSupabaseUuid(id)) {
      const adminSupabase = createSupabaseAdmin();
      const authDelete = await adminSupabase.auth.admin.deleteUser(id);
      if (authDelete.error) {
        return {
          success: false,
          error: `Failed to delete auth user: ${authDelete.error.message}`,
        };
      }
    }

    await db.delete(users).where(eq(users.id, id));

    await logAudit({
      userId: caller.id,
      userName: caller.name,
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
    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };
    if (caller.role !== "admin") {
      return { success: false, error: "Forbidden" };
    }

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
    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };
    if (caller.role !== "admin") {
      return { success: false, error: "Forbidden" };
    }

    const request = await db.query.registrationRequests.findFirst({
      where: (table, { eq }) => eq(table.id, requestId),
    });

    if (!request) return { success: false, error: "Request not found" };

    const adminSupabase = createSupabaseAdmin();
    const authResult = request.password
      ? await adminSupabase.auth.admin.createUser({
          email: request.email,
          password: request.password,
          email_confirm: true,
          user_metadata: { name: request.name },
        })
      : await adminSupabase.auth.admin.inviteUserByEmail(request.email, {
          data: { name: request.name },
        });

    if (authResult.error || !authResult.data.user) {
      return {
        success: false,
        error: authResult.error?.message || "Failed to provision auth user",
      };
    }

    await db.insert(users).values({
      id: authResult.data.user.id,
      name: request.name,
      email: request.email,
      phone: request.phone ?? null,
      role,
      outletId: outletId ?? null,
      isActive: "true",
    });

    await db
      .update(registrationRequests)
      .set({ status: "approved", password: null, updatedAt: new Date() })
      .where(eq(registrationRequests.id, requestId));

    await logAudit({
      userId: caller.id,
      userName: caller.name,
      action: "approve",
      entityType: "registration_request",
      entityId: requestId,
      newData: {
        role,
        outletId: outletId ?? null,
        userId: authResult.data.user.id,
      },
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
    const caller = await getCaller();
    if (!caller) return { success: false, error: "Unauthorized" };
    if (caller.role !== "admin") {
      return { success: false, error: "Forbidden" };
    }

    await db
      .update(registrationRequests)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(registrationRequests.id, requestId));

    await logAudit({
      userId: caller.id,
      userName: caller.name,
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
