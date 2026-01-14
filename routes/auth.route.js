import express from "express";
import { MongoClient } from "mongodb";
import {
  isAuth,
  isAuthMember
} from "../middleware/auth.js";
import {
  loginUser,
  getMyUser,
  getMyMember,
  loginMember,
  registerMember,
  registerMemberV2,
  registerMemberTestEmail,
  verifyMember,
  checkMember,
  forgotPasswordMember,
  verifyOtpForgotPasswordMember,
  changeMemberPassword,
  forgotPasswordMemberByToken,
  changeMemberPasswordByToken
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/my-account", isAuth, getMyUser);
router.get("/member/my-account", isAuthMember, getMyMember);
router.post("/member/login", loginMember);
router.post("/member/register", registerMember);
router.post("/member/register/v2", registerMemberV2);
router.post("/member/register/test", registerMemberTestEmail);
router.post("/member/register/verify", verifyMember);
router.post("/member/check", checkMember);
router.post("/member/forgot-password", forgotPasswordMember);
router.post("/member/forgot-password-verify", verifyOtpForgotPasswordMember);
router.post("/member/change-password", changeMemberPassword);
router.post("/member/v2/forgot-password", forgotPasswordMemberByToken);
router.post("/member/v2/change-password", changeMemberPasswordByToken);

// Logout route
router.get("/logout", async (req, res) => {
  return res.status(200).json({ message: "Logout successful" });
});

export default router;
