import express from "express";
import {
  isAuth,
} from "../../middleware/auth.js";
import {
  loginUser,
  getMyUser,
} from "../../controllers/user/authUser.controller.js";

const router = express.Router();

router.get("/my-account", isAuth, getMyUser);
router.post("/login", loginUser);

export default router;
