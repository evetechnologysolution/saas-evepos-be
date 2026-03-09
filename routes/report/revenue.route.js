import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getRevenueV2 } from "../../controllers/report/revenue.controller.js";

const router = express.Router();

// GET POPULAR MENU THIS MONTH
router.get("/", isAuth, getRevenueV2);

export default router;
