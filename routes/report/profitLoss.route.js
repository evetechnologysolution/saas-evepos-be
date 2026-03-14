import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getProfitLoss } from "../../controllers/report/profitLoss.controller.js";

const router = express.Router();

// GET POPULAR MENU THIS MONTH
router.get("/", isAuth, getProfitLoss);

export default router;
