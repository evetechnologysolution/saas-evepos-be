import express from "express";
import { isAuth, isAuthMember } from "../middleware/auth.js";
import {
    getAllMember,
    getAllMemberPending,
    getMemberBySearch,
    checkMember,
    getMemberById,
    addMember,
    editMember,
    changeMemberPassword,
    deleteMember
} from "../controllers/member.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllMember);
router.get("/pending", getAllMemberPending);
router.get("/track", getMemberBySearch);

// GET A SPECIFIC DATA
router.get("/:id", getMemberById);

// CREATE NEW DATA
router.post("/", addMember);
router.post("/check", checkMember);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMember, editMember);

// UPDATE PASSWORD
router.patch("/change-password/:id", isAuthMember, changeMemberPassword);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteMember);

export default router;