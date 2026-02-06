import express from "express";
import {
    checkSubsStatus
} from "../../controllers/cron/cron.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/check-subscription", checkSubsStatus);

export default router;