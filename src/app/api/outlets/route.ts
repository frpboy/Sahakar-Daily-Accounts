import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlets, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location, type } = body;
    const isPharmacy = type === "Hyper Pharmacy" || type === "Pharmacy";
    const finalType = isPharmacy
      ? "SAHAKAR HYPER PHARMACY"
      : "SAHAKAR SMART CLINIC";
    const prefix = isPharmacy ? "SHP" : "SSC";

    const nextOutlet = await db
      .select({ code: outlets.code })
      .from(outlets)
      .where(eq(outlets.type, finalType))
      .orderBy(desc(outlets.createdAt))
      .limit(1);

    let nextNum = 1;
    if (nextOutlet[0]?.code) {
      const match = nextOutlet[0].code.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0]) + 1;
      }
    }
    const generatedCode = `${prefix}-${nextNum.toString().padStart(3, "0")}`;

    // Create the outlet
    const newOutlet = await db
      .insert(outlets)
      .values({
        name,
        code: generatedCode,
        location: location || "",
        type: finalType,
        isActive: true,
      })
      .returning();

    // Create audit log
    await db.insert(auditLogs).values({
      userName: "Admin",
      action: "CREATE",
      entityType: "outlets",
      entityId: newOutlet[0].id,
      newData: JSON.stringify(newOutlet[0]),
    });

    return NextResponse.json(newOutlet[0]);
  } catch (error) {
    console.error("Failed to create outlet:", error);
    return NextResponse.json(
      { error: "Failed to create outlet" },
      { status: 500 }
    );
  }
}
