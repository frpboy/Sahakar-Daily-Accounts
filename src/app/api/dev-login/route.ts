import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { outlets, users } from "@/db/schema";
import { getDevLoginProfile, isDevLoginEnabled } from "@/lib/dev-login-profiles";

function createSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function resolveOutletId(
  assignment: "none" | "first" | "second",
  outletList: Array<{ id: string; name: string }>
) {
  if (assignment === "none") {
    return null;
  }

  if (assignment === "second") {
    return outletList[1]?.id ?? outletList[0]?.id ?? null;
  }

  return outletList[0]?.id ?? null;
}

export async function POST(request: NextRequest) {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const { profileKey } = (await request.json()) as { profileKey?: string };
    if (!profileKey) {
      return NextResponse.json({ error: "Profile key is required" }, { status: 400 });
    }

    const profile = getDevLoginProfile(profileKey);
    if (!profile) {
      return NextResponse.json({ error: "Unknown profile" }, { status: 404 });
    }

    const outletList = await db
      .select({ id: outlets.id, name: outlets.name })
      .from(outlets)
      .orderBy(asc(outlets.name));

    const outletId = resolveOutletId(profile.outletAssignment, outletList);
    const outletName = outletList.find((outlet) => outlet.id === outletId)?.name ?? null;

    const adminSupabase = createSupabaseAdmin();
    const authUsers = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authUsers.error) {
      return NextResponse.json({ error: authUsers.error.message }, { status: 500 });
    }

    let authUser = authUsers.data.users.find((user) => user.email === profile.email) ?? null;

    if (authUser) {
      const updateResult = await adminSupabase.auth.admin.updateUserById(authUser.id, {
        email: profile.email,
        password: profile.password,
        email_confirm: true,
        user_metadata: {
          name: profile.name,
          full_name: profile.name,
        },
      });

      if (updateResult.error) {
        return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
      }

      authUser = updateResult.data.user;
    } else {
      const createResult = await adminSupabase.auth.admin.createUser({
        email: profile.email,
        password: profile.password,
        email_confirm: true,
        user_metadata: {
          name: profile.name,
          full_name: profile.name,
        },
      });

      if (createResult.error || !createResult.data.user) {
        return NextResponse.json(
          { error: createResult.error?.message ?? "Failed to create auth user" },
          { status: 500 }
        );
      }

      authUser = createResult.data.user;
    }

    const existingDbUser = await db.query.users.findFirst({
      where: eq(users.email, profile.email),
    });

    if (existingDbUser) {
      await db
        .update(users)
        .set({
          id: authUser.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          outletId,
          isActive: "true",
          updatedAt: new Date(),
        })
        .where(eq(users.email, profile.email));
    } else {
      await db.insert(users).values({
        id: authUser.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        outletId,
        isActive: "true",
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        key: profile.key,
        email: profile.email,
        password: profile.password,
        role: profile.role,
        outletId,
        outletName,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to provision test user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
