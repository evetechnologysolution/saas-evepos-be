import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getHistory,
    getHistoryById,
    addHistory,
    editHistory,
    deleteHistory
} from "../controllers/pointHistory.controller.js";

const router = express.Router();

router.get("/", getHistory);
router.get("/:id", isAuth, getHistoryById);
router.post("/", isAuth, addHistory);
router.patch("/:id", isAuth, editHistory);
router.delete("/:id", isAuth, deleteHistory);

export default router;