import express from "express";
import { isAuthMaster } from "../../middleware/auth.js";
import { getAll, getDataById, editData, deleteData } from "../../controllers/core/tenantLog.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuthMaster, getAll);

// GET A SPECIFIC DATA
router.get("/:id", isAuthMaster, getDataById);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMaster, editData);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuthMaster, deleteData);

export default router;
