import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    createPayment,
    recreatePayment,
    checkDataPayment,
    successPayment,
    failedPayment,
    callbackSuccessPayment,
} from "../../controllers/payment/payment.controller.js";

const router = express.Router();

// CREATE NEW DATA
router.post("/", isAuth, createPayment);
router.post("/check/:id", isAuth, checkDataPayment);
router.post("/recreate/:id", isAuth, recreatePayment);

// UPDATE A SPECIFIC DATA
router.post("/success/:id", isAuth, successPayment);

router.post("/failed/:id", isAuth, failedPayment);

// UPDATE A SPECIFIC DATA
router.post("/success-callback", callbackSuccessPayment);

export default router;
