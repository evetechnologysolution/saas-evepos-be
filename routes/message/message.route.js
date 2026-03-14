import express from "express";
import { isAuth } from "../../middleware/auth.js";
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
    deleteMessage,
} from "../../controllers/message/message.controller.js";

const router = express.Router();

router.get("/conversations", isAuth, getAllConvers);
router.get("/conversations/:id", isAuth, getConversById);
router.get("/", isAuth, getAllMessages);
router.get("/:id", isAuth, getMessageById);
router.get("/member/conversations/:id", isAuth, getAllConversByMember);
router.get("/member/:id", isAuth, getAllMessagesByMember);
router.post("/send", isAuth, createMessage);
router.patch("/admin/read/:id", isAuth, editMessageStatusForAdmin);
router.patch("/member/read/:id", isAuth, editMessageStatusForMember);
router.patch("/:id", isAuth, editMessage);
router.delete("/conversations/:id", isAuth, deleteConvers);
router.delete("/:id", isAuth, deleteMessage);

export default router;
