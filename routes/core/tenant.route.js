import express from "express";
import { isAuthMaster } from "../../middleware/auth.js";
import { getAll, getDataById, editData, completeData, deleteData } from "../../controllers/core/tenant.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuthMaster, getAll);

// GET A SPECIFIC DATA
router.get("/:id", isAuthMaster, getDataById);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMaster, editData);
router.patch("/complete/:id", completeData); // saat register, tidak perlu auth

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuthMaster, deleteData);

export default router;
