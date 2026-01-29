import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getPopularProduct, getPopularProductByCategory } from "../../controllers/report/popular.controller.js";

const router = express.Router();

// GET POPULAR MENU THIS MONTH
router.get("/", isAuth, getPopularProduct);
router.get("/category", isAuth, getPopularProductByCategory);

export default router;
