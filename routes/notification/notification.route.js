import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getAllNotification } from "../../controllers/notification/notification.controller.js";

const router = express.Router();

router.get("/all", isAuth, getAllNotification);

export default router;
