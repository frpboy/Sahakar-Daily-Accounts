"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSessionContext } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "OTHER";

interface CreateAuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  outletId?: string;
  oldData?: any;
  newData?: any;
  description?: string;
}

/**
 * Creates an entry in the audit_logs table.
 * This is a server action designed to be called internally or from forms.
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const session = await getSessionContext();
    
    await db.insert(auditLogs).values({
      userId: session?.user?.id || "system",
      userName: session?.user?.name || "System",
      outletId: params.outletId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldData: params.oldData,
      newData: params.newData,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return { success: false, error: "Failed to create audit log" };
  }
}

/**
 * Convenience wrapper for logging successful actions.
 */
export async function logAction(
  action: AuditAction, 
  entityType: string, 
  entityId: string, 
  newData?: any, 
  oldData?: any,
  outletId?: string
) {
  return createAuditLog({
    action,
    entityType,
    entityId,
    outletId,
    newData,
    oldData,
  });
}
