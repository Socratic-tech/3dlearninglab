import "server-only";
import type { DB } from "../db/client";
import { auditLogs } from "../db/schema";

export async function audit(
  db: DB,
  entry: { actorId?: string | null; organizationId?: string | null; action: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown> },
) {
  try {
    await db.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      organizationId: entry.organizationId ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ?? {},
    });
  } catch (e) {
    // Audit logging must never break the user's action.
    console.error("[audit] failed to write", entry.action, e);
  }
}
