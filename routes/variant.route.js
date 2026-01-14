import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllVariant,
    getPaginateVariant,
    getVariantById,
    addVariant,
    editVariant,
    deleteVariant
} from "../controllers/variant.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllVariant);

// GETTING ALL THE DATA
router.get("/paginate", getPaginateVariant);

// GET A SPECIFIC DATA
router.get("/:id", getVariantById);

// CREATE NEW DATA
router.post("/", addVariant);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editVariant);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteVariant);

export default router;