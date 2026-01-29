import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllSetting,
    saveSetting,
} from "../../controllers/setting/setting.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllSetting);

// GETTING ALL THE DATA
router.post("/", isAuth, saveSetting);

export default router;
