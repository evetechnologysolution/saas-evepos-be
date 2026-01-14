import express from "express";
import { isAuth, isAuthMember } from "../middleware/auth.js";
import {
    getAllVoucher,
    getAllAvailableVoucher,
    getVoucherById,
    redeemVoucher,
    addVoucher,
    editVoucher,
    deleteVoucher
} from "../controllers/voucher.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllVoucher);

// GETTING ALL THE DATA
router.get("/available", getAllAvailableVoucher);

// GET A SPECIFIC DATA
router.get("/:id", getVoucherById);

router.post("/redeem", isAuthMember, redeemVoucher);

// CREATE NEW DATA
router.post("/", addVoucher);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editVoucher);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteVoucher);

export default router;