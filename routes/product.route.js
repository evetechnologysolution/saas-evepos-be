import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllProduct,
    getPaginateProduct,
    getProductById,
    addProduct,
    editProduct,
    deleteProduct
} from "../controllers/product.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllProduct);

// GETTING ALL THE DATA
router.get("/paginate", getPaginateProduct);

// GET A SPECIFIC DATA
router.get("/:id", getProductById);

// CREATE NEW DATA
router.post("/", addProduct);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editProduct);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteProduct);

export default router;