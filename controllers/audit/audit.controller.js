import AuditLog from "../../models/audit/audittrail.js";
import { errorResponse } from "../../utils/errorResponse.js";

/**
 * ===============================
 * GET AUDIT LOGS (LIST)
 * ===============================
 * Query params:
 * - entity
 * - entityId
 * - action
 * - userId
 * - dateFrom
 * - dateTo
 * - page
 * - limit
 */
export const getAuditLogs = async (req, res) => {
  try {
    const {
      entity,
      entityId,
      action,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (entity) filter.entity = entity;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = action;
    if (userId) filter["actor.userId"] = userId;

    if (dateFrom || dateTo) {
      filter.accessedAt = {};
      if (dateFrom) filter.accessedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.accessedAt.$lte = new Date(dateTo);
    }

    const audits = await AuditLog.find(filter)
      .sort({ accessedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await AuditLog.countDocuments(filter);

    return res.json({
      data: audits,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      code: "SERVER_ERROR",
      message: err.message || "Gagal mengambil audit log",
    });
  }
};

/**
 * ===============================
 * GET AUDIT LOG DETAIL
 * ===============================
 */
export const getAuditDetail = async (req, res) => {
  try {
    const audit = await AuditLog.findById(req.params.id).lean();

    if (!audit) {
      return res.status(404).json({
        status: 404,
        message: "Audit log tidak ditemukan",
      });
    }

    return res.json(audit);
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      code: "SERVER_ERROR",
      message: err.message || "Gagal mengambil detail audit",
    });
  }
};

/**
 * ===============================
 * GET AUDIT BY ENTITY
 * ===============================
 */
export const getAuditByEntity = async (req, res) => {
  try {
    const { entity, entityId } = req.params;

    const audits = await AuditLog.find({
      entity,
      entityId,
    })
      .sort({ accessedAt: -1 })
      .lean();

    return res.json(audits);
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      code: "SERVER_ERROR",
      message: err.message || "Gagal mengambil audit entity",
    });
  }
};
