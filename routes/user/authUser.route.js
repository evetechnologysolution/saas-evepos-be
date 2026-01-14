import express from "express";
import {
  isAuth,
} from "../../middleware/auth.js";
import {
  loginUser,
  getMyUser,
  forgotPasswordByToken,
  changePasswordByToken,
} from "../../controllers/user/authUser.controller.js";

const router = express.Router();

router.get("/my-account", isAuth, getMyUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPasswordByToken);
router.post("/change-password", changePasswordByToken);

export default router;
