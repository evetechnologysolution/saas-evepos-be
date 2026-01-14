import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllInfo,
    saveInfo
} from "../controllers/information.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllInfo);

// GETTING ALL THE DATA
router.post("/save", isAuth, saveInfo);

export default router;