import express from "express";
import {
    getAllUsed,
    getUsedById,
    checkUsed,
    checkUsedByPhone,
} from "../controllers/voucherUsed.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllUsed);

// GET A SPECIFIC DATA
router.get("/:id", getUsedById);

// CHECK VOUCHER USED
router.post("/check", checkUsed);
router.post("/check-by-phone", checkUsedByPhone);

export default router;