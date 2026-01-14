import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllReceipt,
    saveReceipt
} from "../controllers/receipt.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllReceipt);

// GETTING ALL THE DATA
router.post("/save", isAuth, saveReceipt);

export default router;