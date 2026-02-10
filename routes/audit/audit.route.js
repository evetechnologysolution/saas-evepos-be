import express from "express";
import {
  getAuditLogs,
  getAuditDetail,
  getAuditByEntity,
} from "../../controllers/audit/audit.controller.js";
import { isAuthMaster } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", isAuthMaster, getAuditLogs);
router.get("/:id", isAuthMaster, getAuditDetail);
router.get("/entity/:entity/:entityId", isAuthMaster, getAuditByEntity);

export default router;
