import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getRevenue } from "../../controllers/report/revenue.controller.js";

const router = express.Router();

// GET POPULAR MENU THIS MONTH
router.get("/", isAuth, getRevenue);

export default router;
