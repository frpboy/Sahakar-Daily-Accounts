"use server";

import { db } from "@/db";
import { registrationRequests, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Submit a registration request (unauthenticated — called from /register page)
export async function submitRegistrationRequest(data: {
  name: string;
  email: string;
  phone?: string;
}) {
  try {
    const existing = await db
      .select()
      .from(registrationRequests)
      .where(eq(registrationRequests.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      return { error: "A request with this email already exists." };
    }

    await db.insert(registrationRequests).values({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      status: "pending",
    });

    return { success: true };
  } catch {
    return { error: "Failed to submit registration request." };
  }
}

// Get all pending registration requests (admin/ho_accountant only)
export async function getRegistrationRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser[0] || !["admin", "ho_accountant"].includes(dbUser[0].role ?? "")) {
    return { error: "Forbidden" };
  }

  const requests = await db
    .select()
    .from(registrationRequests)
    .orderBy(registrationRequests.createdAt);

  return { requests };
}

// Approve a registration request — sends Supabase invite email
export async function approveRegistrationRequest(
  requestId: string,
  role: string,
  outletId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser[0] || !["admin", "ho_accountant"].includes(dbUser[0].role ?? "")) {
    return { error: "Forbidden" };
  }

  const [request] = await db
    .select()
    .from(registrationRequests)
    .where(eq(registrationRequests.id, requestId))
    .limit(1);

  if (!request) return { error: "Request not found" };

  // Use service role key to invite user via Supabase Admin API
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
    request.email,
    { redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("supabase.co", "") || ""}` }
  );

  if (inviteError) {
    return { error: `Failed to send invite: ${inviteError.message}` };
  }

  // Create user record in our users table
  await db.insert(users).values({
    id: inviteData.user.id,
    name: request.name,
    email: request.email,
    phone: request.phone ?? undefined,
    role: role as "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant",
    outletId: outletId ?? null,
    isActive: "true",
  });

  // Mark request as approved
  await db
    .update(registrationRequests)
    .set({ status: "approved", reviewedBy: user.id, updatedAt: new Date() })
    .where(eq(registrationRequests.id, requestId));

  revalidatePath("/admin/users");
  return { success: true };
}

// Reject a registration request
export async function rejectRegistrationRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser[0] || !["admin", "ho_accountant"].includes(dbUser[0].role ?? "")) {
    return { error: "Forbidden" };
  }

  await db
    .update(registrationRequests)
    .set({ status: "rejected", reviewedBy: user.id, updatedAt: new Date() })
    .where(eq(registrationRequests.id, requestId));

  revalidatePath("/admin/users");
  return { success: true };
}
