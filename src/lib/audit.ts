import prisma from "./prisma";

interface LogAuditParams {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}

export async function createAuditLog({
  actorId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: LogAuditParams) {
  try {
    const formattedDetails =
      typeof details === "object" && details !== null
        ? JSON.stringify(details)
        : details || null;

    return await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        entity,
        entityId: entityId || null,
        details: formattedDetails,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Audit log failure should not break the core user flow, but is logged to stderr
    return null;
  }
}
