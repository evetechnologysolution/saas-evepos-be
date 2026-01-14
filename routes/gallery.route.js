import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
  getAllGallery,
  getGalleryById,
  addGallery,
  editGallery,
  deleteGallery,
} from "../controllers/gallery.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllGallery);

// GET A SPECIFIC DATA
router.get("/:id", getGalleryById);

// CREATE NEW DATA
router.post("/", addGallery);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editGallery);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteGallery);

export default router;
