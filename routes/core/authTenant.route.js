import express from "express";
import {
  registerTenant,
  verifyRegisterTenant,
  resendVerify,
} from "../../controllers/core/authTenant.controller.js";

const router = express.Router();

router.post("/register", registerTenant);
router.post("/register/verify", verifyRegisterTenant);
router.post("/register/resend-verify", resendVerify);

export default router;
