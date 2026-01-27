import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllPromotion,
    getAvailablePromotion,
    getPromotionById,
    addPromotion,
    editPromotion,
    deletePromotion,
} from "../../controllers/library/promotion.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllPromotion);

// GETTING ALL THE DATA
router.get("/available", isAuth, getAvailablePromotion);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getPromotionById);

// CREATE NEW DATA
router.post("/", isAuth, addPromotion);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editPromotion);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deletePromotion);

export default router;
