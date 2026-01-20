import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllVoucher,
    getVoucherById,
    getVoucherByScan,
    editVoucher,
    deleteVoucher,
} from "../../controllers/member/voucherMember.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllVoucher);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getVoucherById);

// GET A SPECIFIC VOUCHER BY SCAN
router.get("/scan/:id", isAuth, getVoucherByScan);

// EDIT VOUCHER
router.patch("/:id", isAuth, editVoucher);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteVoucher);

export default router;
