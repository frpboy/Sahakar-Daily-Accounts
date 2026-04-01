"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { revalidatePath } from "next/cache";

export type NotificationType = "info" | "success" | "warning" | "error";

interface SendNotificationParams {
  userId?: string; // If empty, it's a global notification for admins/accountants
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates an entry in the notifications table.
 */
export async function sendNotification(params: SendNotificationParams) {
  try {
    await db.insert(notifications).values({
      userId: params.userId || "all", // "all" for global visibility
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { eq } = await import("drizzle-orm");
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
  try {
    const { eq, or } = await import("drizzle-orm");
    await db.update(notifications)
      .set({ isRead: true })
      .where(
        or(
          eq(notifications.userId, userId),
          eq(notifications.userId, "all")
        )
      );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return { success: false, error: "Failed to update notifications" };
  }
}
