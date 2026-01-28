import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getSales } from "../../controllers/report/sales.controller.js";

const router = express.Router();

// GET POPULAR MENU THIS MONTH
router.get("/", isAuth, getSales);

export default router;
