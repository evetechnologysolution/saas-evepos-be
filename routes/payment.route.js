import express from "express";
import {
    createPayment,
    recreatePayment,
    createPaymentMidtrans,
    recreatePaymentMidtrans,
    successPayment,
    failedPayment,
    callbackSuccessPayment,
    callbackSuccessPaymentMidtrans
} from "../controllers/payment.controller.js";

const router = express.Router();

// CREATE NEW DATA
router.post("/", createPayment);
router.post("/recreate/:id", recreatePayment);

router.post("/midtrans", createPaymentMidtrans);
router.post("/midtrans/recreate/:id", recreatePaymentMidtrans);

// UPDATE A SPECIFIC DATA
router.post("/success/:id", successPayment);

router.post("/failed/:id", failedPayment);

// UPDATE A SPECIFIC DATA
router.post("/success-callback", callbackSuccessPayment);
router.post("/success-callback-midtrans", callbackSuccessPaymentMidtrans);

export default router;