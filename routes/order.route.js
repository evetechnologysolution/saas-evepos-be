import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllOrder,
    getDeliveryOrder,
    getTrackOrder,
    getCountTrackOrder,
    getPaidOrder,
    getCloseCashierOrder,
    getExportOrder,
    getSavedBill,
    getUnfinishedOrder,
    getOrderById,
    getOrderProgressById,
    addOrder,
    generatePoint,
    editOrder,
    editOrderRaw,
    editPrintCount,
    editPrintLaundry,
    deleteOrder,
    getOrderByMember
} from "../controllers/order.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllOrder);
router.get("/delivery", getDeliveryOrder);
router.get("/track", getTrackOrder);
router.get("/track-count", getCountTrackOrder);
router.get("/paid", getPaidOrder);
router.get("/close-cashier", getCloseCashierOrder);
router.get("/export", getExportOrder);
router.get("/saved-bill", getSavedBill);
router.get("/unfinished", getUnfinishedOrder);

router.get("/member/:id", getOrderByMember);

// GET A SPECIFIC DATA
router.get("/:id", getOrderById);
router.get("/progress/:id", getOrderProgressById);

// CREATE NEW DATA
router.post("/", addOrder);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editOrder);
router.patch("/generate-point/:id", generatePoint);
router.patch("/raw/:id", editOrderRaw);
router.patch("/print-count/:id", editPrintCount);
router.patch("/print-laundry/:id", editPrintLaundry);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteOrder);

export default router;