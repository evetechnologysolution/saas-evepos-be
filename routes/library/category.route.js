import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllCategory,
    getPaginateCategory,
    getCategoryById,
    addCategory,
    editCategory,
    deleteCategory
} from "../../controllers/library/category.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/all", isAuth, getAllCategory);
router.get("/", isAuth, getPaginateCategory);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getCategoryById);

// CREATE NEW DATA
router.post("/", isAuth, addCategory);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editCategory);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteCategory);

export default router;