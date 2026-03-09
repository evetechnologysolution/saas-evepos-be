import AuditLog from "../models/audit/audittrail.js";

/**
 * Audit Logger Helper
 */
export const logAudit = async ({
  req,
  entity,
  entityId,
  action,
  before = null,
  after = null,
}) => {
  try {
    await AuditLog.create({
      entity,
      entityId,
      action,
      changes: {
        before,
        after,
      },
      actor: req?.userData
        ? {
            userId: req.userData._id,
            fullname: req.userData.fullname,
            username: req.userData.username,
          }
        : null,
    });
  } catch (error) {
    // Audit TIDAK BOLEH bikin API gagal
    console.error("[AUDIT_LOG_ERROR]", error.message);
  }
};
