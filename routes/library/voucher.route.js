import express from "express";
import { isAuth, isAuthMember } from "../../middleware/auth.js";
import {
    getAllVoucher,
    getAllAvailableVoucher,
    getVoucherById,
    redeemVoucher,
    addVoucher,
    editVoucher,
    deleteVoucher,
} from "../../controllers/library/voucher.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllVoucher);

// GETTING ALL THE DATA
router.get("/available", isAuth, getAllAvailableVoucher);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getVoucherById);

router.post("/redeem", isAuthMember, redeemVoucher);

// CREATE NEW DATA
router.post("/", isAuth, addVoucher);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editVoucher);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteVoucher);

export default router;
