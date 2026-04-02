"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSessionContext } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "OTHER";

interface CreateAuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const session = await getSessionContext();

    await db.insert(auditLogs).values({
      userId: session?.user?.id || "system",
      userName: session?.user?.name || "System",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldData: params.oldData,
      newData: params.newData,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return { success: false, error: "Failed to create audit log" };
  }
}

export async function logAction(
  action: AuditAction,
  entityType: string,
  entityId: string,
  newData?: any,
  oldData?: any
) {
  return createAuditLog({
    action,
    entityType,
    entityId,
    newData,
    oldData,
  });
}
