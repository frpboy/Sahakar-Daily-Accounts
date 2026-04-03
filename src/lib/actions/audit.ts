"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export interface AuditParams {
  userId: string;
  userName?: string;
  action: "create" | "update" | "delete" | "approve" | "reject";
  entityType: "daily_account" | "user" | "registration_request";
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      userName: params.userName ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldData: params.oldData ?? null,
      newData: params.newData ?? null,
    });
  } catch (err) {
    // Audit log failure must never crash the calling action
    console.error("[audit] Failed to write audit log:", err);
  }
}
