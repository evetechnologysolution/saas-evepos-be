import express from "express";
import {
    verify,
    greetings
} from "../../controllers/wa-webhook/webhook.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", verify);
router.post("/", greetings);

export default router;
