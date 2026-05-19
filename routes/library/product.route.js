import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllRawProductV2,
    getAllProduct,
    getProductById,
    reorderProduct,
    addProduct,
    editProduct,
    deleteProduct
} from "../../controllers/library/product.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/all", isAuth, getAllRawProductV2);
router.get("/", isAuth, getAllProduct);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getProductById);

// CREATE NEW DATA
router.post("/reorder", isAuth, reorderProduct);
router.post("/", isAuth, addProduct);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editProduct);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteProduct);

export default router;