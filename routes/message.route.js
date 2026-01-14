import express from "express";
import { isAdminOrMember } from "../middleware/auth.js";
import {
    getAllConvers,
    getAllConversByMember,
    getAllMessages,
    getAllMessagesByMember,
    getConversById,
    getMessageById,
    createMessage,
    editMessage,
    editMessageStatusForAdmin,
    editMessageStatusForMember,
    deleteConvers,
    deleteMessage
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/conversations", isAdminOrMember, getAllConvers);
router.get("/conversations/:id", isAdminOrMember, getConversById);
router.get("/", isAdminOrMember, getAllMessages);
router.get("/:id", isAdminOrMember, getMessageById);
router.get("/member/conversations/:id", isAdminOrMember, getAllConversByMember);
router.get("/member/:id", isAdminOrMember, getAllMessagesByMember);
router.post("/send", isAdminOrMember, createMessage);
router.patch("/admin/read/:id", isAdminOrMember, editMessageStatusForAdmin);
router.patch("/member/read/:id", isAdminOrMember, editMessageStatusForMember);
router.patch("/:id", isAdminOrMember, editMessage);
router.delete("/conversations/:id", isAdminOrMember, deleteConvers);
router.delete("/:id", isAdminOrMember, deleteMessage);

export default router;