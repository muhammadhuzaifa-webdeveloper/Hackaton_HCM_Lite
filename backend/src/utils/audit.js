// utils/audit.js
import AuditLog from "../models/AuditLog.js";

export async function logAudit({ req, actor, action, entity, entityId, before, after }) {
  try {
    const actorInfo = actor || {
      id: req?.user?._id,
      email: req?.user?.email || "system",
      role: req?.user?.role || "System",
    };

    const ipAddress = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "";
    const userAgent = req?.headers?.["user-agent"] || "";

    await AuditLog.create({
      actor: actorInfo,
      action,
      entity,
      entityId: entityId ? String(entityId) : "",
      before: before ? JSON.parse(JSON.stringify(before)) : null,
      after: after ? JSON.parse(JSON.stringify(after)) : null,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
}
