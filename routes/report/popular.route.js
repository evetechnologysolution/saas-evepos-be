import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getPopularProduct } from "../../controllers/report/popular.controller.js";

const router = express.Router();

// GET POPULAR MENU THIS MONTH
router.get("/", isAuth, getPopularProduct);

export default router;
