import express from "express";
import { isAuth } from "../../middleware/auth.js";
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
    editOrder,
    editOrderRaw,
    editPrintCount,
    editPrintLaundry,
    deleteOrder,
    getOrderByMember,
} from "../../controllers/pos/order.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllOrder);
router.get("/delivery", isAuth, getDeliveryOrder);
router.get("/track", isAuth, getTrackOrder);
router.get("/track-count", isAuth, getCountTrackOrder);
router.get("/paid", isAuth, getPaidOrder);
router.get("/close-cashier", isAuth, getCloseCashierOrder);
router.get("/export", isAuth, getExportOrder);
router.get("/saved-bill", isAuth, getSavedBill);
router.get("/unfinished", isAuth, getUnfinishedOrder);

router.get("/member/:id", isAuth, getOrderByMember);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getOrderById);
router.get("/progress/:id", isAuth, getOrderProgressById);

// CREATE NEW DATA
router.post("/", isAuth, addOrder);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editOrder);
router.patch("/raw/:id", isAuth, editOrderRaw);
router.patch("/print-count/:id", isAuth, editPrintCount);
router.patch("/print-laundry/:id", isAuth, editPrintLaundry);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteOrder);

export default router;
