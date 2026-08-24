import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export interface AuditEventParams {
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  orgId?: string;
  metadata?: Record<string, any>;
}

/**
 * Enterprise Audit Logger: Records security, administrative, and data-modifying events
 * into the immutable audit_logs database table.
 */
export async function recordAuditLog(params: AuditEventParams): Promise<void> {
  try {
    let actorId = params.actorId;
    let orgId = params.orgId || "org_myorganisation";

    if (!actorId) {
      try {
        const user = await getCurrentUser();
        if (user) {
          actorId = user.id;
          orgId = user.orgId || orgId;
        }
      } catch {
        // Unauthenticated or system-triggered event
      }
    }

    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(auditLogs).values({
      id: logId,
      orgId,
      actorId: actorId || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata || {},
      createdAt: new Date(),
    });
  } catch (error) {
    // Fail silently in production without crashing user transactions, but log to console
    console.error("Audit log record failed:", error);
  }
}
