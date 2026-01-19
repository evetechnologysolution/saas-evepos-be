import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllVariant,
    getPaginateVariant,
    getVariantById,
    addVariant,
    editVariant,
    deleteVariant
} from "../../controllers/library/variant.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/all", isAuth, getAllVariant);
router.get("/", isAuth, getPaginateVariant);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getVariantById);

// CREATE NEW DATA
router.post("/", isAuth, addVariant);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editVariant);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteVariant);

export default router;