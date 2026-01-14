import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllSubcategory,
    getPaginateSubcategory,
    getSubcategoryById,
    addSubcategory,
    editSubcategory,
    deleteSubcategory
} from "../../controllers/library/subcategory.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/all", isAuth, getAllSubcategory);
router.get("/", isAuth, getPaginateSubcategory);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getSubcategoryById);

// CREATE NEW DATA
router.post("/", isAuth, addSubcategory);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editSubcategory);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteSubcategory);

export default router;