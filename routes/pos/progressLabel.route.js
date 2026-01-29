import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllData,
    getAllRawData,
    getDataById,
    addData,
    editData,
    deleteData
} from "../../controllers/pos/progressLabel.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/all", isAuth, getAllRawData);
router.get("/", isAuth, getAllData);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getDataById);

// CREATE NEW DATA
router.post("/", isAuth, addData);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editData);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteData);

export default router;