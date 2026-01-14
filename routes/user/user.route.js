import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllUser,
    getUserById,
    addUser,
    editUser,
    changeUserPassword,
    deleteUser
} from "../../controllers/user/user.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllUser);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getUserById);

// CREATE NEW DATA
router.post("/", isAuth, addUser);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editUser);

// UPDATE A SPECIFIC DATA
router.patch("/profile/:id", isAuth, editUser);

// UPDATE PASSWORD
router.patch("/change-password/:id", isAuth, changeUserPassword);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteUser);

export default router;