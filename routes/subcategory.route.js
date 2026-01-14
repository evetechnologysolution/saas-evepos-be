import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllSubcategory,
    getPaginateSubcategory,
    getSubcategoryById,
    addSubcategory,
    editSubcategory,
    deleteSubcategory
} from "../controllers/subcategory.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllSubcategory);

// GETTING ALL THE DATA
router.get("/paginate", getPaginateSubcategory);

// GET A SPECIFIC DATA
router.get("/:id", getSubcategoryById);

// CREATE NEW DATA
router.post("/", addSubcategory);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editSubcategory);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteSubcategory);

export default router;