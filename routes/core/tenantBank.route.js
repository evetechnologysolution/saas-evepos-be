import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getAll, getDataById, addData, editData, deleteData } from "../../controllers/core/tenantBank.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAll);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getDataById);

// CREATE NEW DATA
router.post("/", isAuth, addData);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editData);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteData);

export default router;
