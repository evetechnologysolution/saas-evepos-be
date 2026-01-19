import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllPromotion,
    getAvailablePromotion,
    getPromotionById,
    addPromotion,
    editPromotion,
    deletePromotion
} from "../../controllers/library/promotion.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllPromotion);

// GETTING ALL THE DATA
router.get("/available", getAvailablePromotion);

// GET A SPECIFIC DATA
router.get("/:id", getPromotionById);

// CREATE NEW DATA
router.post("/", addPromotion);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editPromotion);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deletePromotion);

export default router;