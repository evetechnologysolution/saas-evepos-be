import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllTax,
    saveTax
} from "../controllers/tax.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllTax);

// GETTING ALL THE DATA
router.post("/", isAuth, saveTax);

export default router;