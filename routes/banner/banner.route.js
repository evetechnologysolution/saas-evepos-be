import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllBanner,
    getAvailableBanner,
    getBannerById,
    addBanner,
    editBanner,
    deleteBanner,
} from "../../controllers/banner/banner.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllBanner);
router.get("/available", isAuth, getAvailableBanner);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getBannerById);

// CREATE NEW DATA
router.post("/", isAuth, addBanner);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editBanner);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteBanner);

export default router;
