import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllVoucher,
    getVoucherById,
    getVoucherByScan,
    editVoucher,
    deleteVoucher
} from "../controllers/voucherMember.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllVoucher);

// GET A SPECIFIC DATA
router.get("/:id", getVoucherById);

// GET A SPECIFIC VOUCHER BY SCAN
router.get("/scan/:id", getVoucherByScan);

// EDIT VOUCHER
router.patch("/:id", editVoucher);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteVoucher);

export default router;