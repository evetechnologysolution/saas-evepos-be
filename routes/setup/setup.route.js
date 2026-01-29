import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllSetup,
} from "../../controllers/setup/setup.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllSetup);

export default router;