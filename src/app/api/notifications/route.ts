import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSessionContext();
    
    // Fetch notifications for the specific user OR global "all" notifications
    const result = await db
      .select()
      .from(notifications)
      .where(
        or(
          eq(notifications.userId, session.user.id),
          eq(notifications.userId, "all")
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
