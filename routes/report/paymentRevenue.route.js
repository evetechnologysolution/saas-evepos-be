import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getPaymentRevenue } from "../../controllers/report/paymentRevenue.controller.js";

const router = express.Router();

// GET POPULAR MENU THIS MONTH
router.get("/", isAuth, getPaymentRevenue);

export default router;
