import express from "express";
import { isAuthMaster } from "../../middleware/auth.js";
import { getAll, getAllRaw, getDataById, addData, editData, deleteData } from "../../controllers/core/service.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/all", isAuthMaster, getAllRaw);
router.get("/", isAuthMaster, getAll);

// GET A SPECIFIC DATA
router.get("/:id", isAuthMaster, getDataById);

// CREATE NEW DATA
router.post("/", isAuthMaster, addData);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMaster, editData);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuthMaster, deleteData);

export default router;
