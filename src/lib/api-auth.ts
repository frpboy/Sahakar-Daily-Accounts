import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export type AuthenticatedUser = {
  id: string;
  role: "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";
  outletId: string | null;
  name: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!dbUser || !dbUser.role) return null;
  return dbUser as AuthenticatedUser;
}

export function isAdminOrHO(
  role: AuthenticatedUser["role"]
): boolean {
  return role === "admin" || role === "ho_accountant";
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
