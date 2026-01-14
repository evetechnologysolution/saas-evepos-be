import express from "express";
import {
    sendEmailDelete
} from "../controllers/help.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.post("/request-delete", sendEmailDelete);

export default router;