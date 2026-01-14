import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllBanner,
    getAvailableBanner,
    getBannerById,
    addBanner,
    editBanner,
    deleteBanner
} from "../controllers/banner.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllBanner);
router.get("/available", getAvailableBanner);

// GET A SPECIFIC DATA
router.get("/:id", getBannerById);

// CREATE NEW DATA
router.post("/", addBanner);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editBanner);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteBanner);

export default router;