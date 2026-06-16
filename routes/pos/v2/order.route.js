import express from "express";
import { isAuth } from "../../../middleware/auth.js";
import {
    getAllOrder,
    getExportOrder,
} from "../../../controllers/pos/v2/order.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllOrder);
router.get("/export", isAuth, getExportOrder);

export default router;
