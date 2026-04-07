import { NextResponse } from "next/server";
import { db } from "@/db";
import { outlets } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getAuthenticatedUser, isAdminOrHO, unauthorized } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    // Outlet-level roles only see their own outlet
    if (!isAdminOrHO(user.role)) {
      if (!user.outletId) {
        return NextResponse.json([]);
      }
      const result = await db
        .select({ id: outlets.id, name: outlets.name })
        .from(outlets)
        .where(eq(outlets.id, user.outletId));
      return NextResponse.json(result);
    }

    const allOutlets = await db
      .select({ id: outlets.id, name: outlets.name })
      .from(outlets)
      .orderBy(asc(outlets.name));

    return NextResponse.json(allOutlets);
  } catch (error) {
    console.error("Outlets list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outlets" },
      { status: 500 }
    );
  }
}
