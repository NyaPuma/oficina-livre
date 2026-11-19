import { db } from "./db";
import { auditLogs } from "./db/schema";

export async function logAudit(
  userId: number | null,
  action: string,
  entity: string,
  entityId?: string | number | null,
  details?: unknown,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entity,
      entityId: entityId == null ? null : String(entityId),
      details: (details ?? null) as never,
    });
  } catch {
    // A auditoria não pode impedir a operação principal.
  }
}
