import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getAllDisc, getAvailableDisc, saveDisc } from "../../controllers/globalDiscount/discount.controller.js";

const router = express.Router();

router.get("/", isAuth, getAvailableDisc);
router.get("/data", isAuth, getAllDisc);
router.post("/", isAuth, saveDisc);

export default router;
