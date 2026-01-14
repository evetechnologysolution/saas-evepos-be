import express from "express";
import {
  registerTenant,
  verifyRegisterTenant,
} from "../../controllers/core/authTenant.controller.js";

const router = express.Router();

router.post("/register", registerTenant);
router.post("/register/verify", verifyRegisterTenant);

export default router;
