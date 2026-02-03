import express from "express";
import {
  isAuthMaster,
} from "../../middleware/auth.js";
import {
  loginUser,
  getMyUser,
  forgotPasswordByToken,
  changePasswordByToken,
} from "../../controllers/user/authUserMaster.controller.js";

const router = express.Router();

router.get("/my-account", isAuthMaster, getMyUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPasswordByToken);
router.post("/change-password", changePasswordByToken);

export default router;
