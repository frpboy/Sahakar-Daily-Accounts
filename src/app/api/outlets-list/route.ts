import { NextResponse } from "next/server";
import { db } from "@/db";
import { outlets } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allOutlets = await db
      .select({
        id: outlets.id,
        name: outlets.name,
      })
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
