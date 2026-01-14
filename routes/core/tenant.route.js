import express from "express";
// import { isAuth } from "../middleware/auth.js";
import {
    getAll,
    getDataById,
    editData,
    completeData,
    deleteData
} from "../../controllers/core/tenant.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAll);

// GET A SPECIFIC DATA
router.get("/:id", getDataById);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editData);
router.patch("/complete/:id", completeData);

// DELETE A SPECIFIC DATA
router.delete("/:id", deleteData);

export default router;