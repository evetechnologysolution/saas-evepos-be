import express from "express";
import { isAuth, isAuthMember } from "../../middleware/auth.js";
import {
    getAllMember,
    getAllMemberPending,
    getMemberBySearch,
    getMemberByPoint,
    checkMember,
    checkMemberV2,
    getMemberById,
    addMember,
    editMember,
    changeMemberPassword,
    deleteMember,
} from "../../controllers/member/member.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllMember);
router.get("/pending", isAuth, getAllMemberPending);
router.get("/track", isAuth, getMemberBySearch);
router.get("/point", isAuth, getMemberByPoint);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getMemberById);

// CREATE NEW DATA
router.post("/", isAuth, addMember);
router.post("/check", checkMember);
router.post("/v2/check", checkMemberV2);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMember, editMember);

// UPDATE PASSWORD
router.patch("/change-password/:id", isAuthMember, changeMemberPassword);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteMember);

export default router;
