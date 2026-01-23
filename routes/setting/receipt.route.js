import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllReceipt,
    saveReceipt,
} from "../../controllers/setting/receipt.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllReceipt);

// GETTING ALL THE DATA
router.post("/", isAuth, saveReceipt);

export default router;
