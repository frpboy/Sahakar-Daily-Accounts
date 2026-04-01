"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    outletId: string | null;
    outletName: string | null;
    isActive: boolean;
  };
  error?: string;
}

export async function loginUser(email: string, _password?: string) {
  try {
    if (!email) {
      return { success: false, error: "Email is required" };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      with: {
        outlet: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.isActive === "false") {
      return {
        success: false,
        error: "Your account is inactive. Contact administrator.",
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        outletId: user.outletId,
        outletName: user.outlet?.name || null,
        isActive: user.isActive !== "false",
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
}

export async function getCurrentUser(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        outlet: true,
      },
    });

    if (!user || user.isActive === "false") {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      outletId: user.outletId,
      outletName: user.outlet?.name || null,
      isActive: user.isActive !== "false",
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
