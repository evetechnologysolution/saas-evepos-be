import express from "express";
import { isAuthMaster, isAuth } from "../../middleware/auth.js";
import { getAll, getDataById, addData, editData, deleteData } from "../../controllers/core/survey.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuthMaster, getAll);

// GET A SPECIFIC DATA
router.get("/:id", isAuthMaster, getDataById);

// CREATE NEW DATA
router.post("/", isAuth, addData); // di isi tenant

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMaster, editData);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuthMaster, deleteData);

export default router;
