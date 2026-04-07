import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
  getAllGallery,
  getGalleryById,
  addGallery,
  editGallery,
  deleteGallery,
} from "../../controllers/article/gallery.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllGallery);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getGalleryById);

// CREATE NEW DATA
router.post("/", isAuth, addGallery);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editGallery);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteGallery);

export default router;
