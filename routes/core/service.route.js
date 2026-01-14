import express from "express";
// import { isAuth } from "../middleware/auth.js";
import {
    getAll,
    getDataById,
    addData,
    editData,
    deleteData
} from "../../controllers/core/service.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAll);

// GET A SPECIFIC DATA
router.get("/:id", getDataById);

// CREATE NEW DATA
router.post("/", addData);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editData);

// DELETE A SPECIFIC DATA
router.delete("/:id", deleteData);

export default router;