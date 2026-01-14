import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllCategory,
    getPaginateCategory,
    getCategoryById,
    addCategory,
    editCategory,
    deleteCategory
} from "../controllers/category.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllCategory);

// GETTING ALL THE DATA
router.get("/paginate", getPaginateCategory);

// GET A SPECIFIC DATA
router.get("/:id", getCategoryById);

// CREATE NEW DATA
router.post("/", addCategory);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editCategory);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteCategory);

export default router;