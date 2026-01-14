import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllDisc,
    getAvailableDisc,
    saveDisc
} from "../controllers/discount.controller.js";

const router = express.Router();

router.get("/", getAvailableDisc);
router.get("/data", getAllDisc);
router.post("/", isAuth, saveDisc);
router.post("/force", saveDisc);

export default router;