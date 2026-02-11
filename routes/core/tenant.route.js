import express from "express";
import { isAuthMaster, isAuth } from "../../middleware/auth.js";
import {
    getAll,
    getDataById,
    editData,
    completeData,
    suspendData,
    activateData,
    deleteData,
} from "../../controllers/core/tenant.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuthMaster, getAll);

// GET A SPECIFIC DATA
router.get("/:id", isAuthMaster, getDataById);
router.get("/user/:id", isAuth, getDataById);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMaster, editData);
router.patch("/user/:id", isAuth, editData);
router.patch("/complete/:id", completeData); // saat register, tidak perlu auth
router.patch("/suspend/:id", isAuthMaster, suspendData);
router.patch("/activate/:id", isAuthMaster, activateData);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuthMaster, deleteData);

export default router;
