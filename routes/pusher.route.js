import express from "express";
import {
    testCall
} from "../controllers/pusher.controller.js";

const router = express.Router();

router.post("/call", testCall);

export default router;