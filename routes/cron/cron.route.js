import express from "express";
import { checkSubsStatus } from "../../controllers/cron/cron.controller.js";
import { runSubscriptionReminder } from "../../controllers/cron/reminder.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/check-subscription", checkSubsStatus);
router.get("/subscription-reminder", runSubscriptionReminder);

export default router;
