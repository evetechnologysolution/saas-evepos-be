import express from "express";
import { isAuthMaster } from "../../middleware/auth.js";
import {
    getAllUser,
    getUserById,
    addUser,
    editUser,
    changeUserPassword,
    deleteUser
} from "../../controllers/userMaster/userMaster.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuthMaster, getAllUser);

// GET A SPECIFIC DATA
router.get("/:id", isAuthMaster, getUserById);

// CREATE NEW DATA
router.post("/", isAuthMaster, addUser);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuthMaster, editUser);

// UPDATE A SPECIFIC DATA
router.patch("/profile/:id", isAuthMaster, editUser);

// UPDATE PASSWORD
router.patch("/change-password/:id", isAuthMaster, changeUserPassword);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuthMaster, deleteUser);

export default router;