"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

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

    const userId = nanoid();
    await db.insert(users).values({
      id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      outletId: input.outletId || null,
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

    await db.delete(users).where(eq(users.id, id));

    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
