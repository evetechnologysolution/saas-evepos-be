import express from "express";
import {
    getCartByMember,
    addItemToCart,
    updateItemQtyToCart,
    deleteItemFromCart,
    clearItemFromCart,
    deleteCart
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/:id", getCartByMember);
router.patch("/:id/add", addItemToCart);
router.patch("/:id/update", updateItemQtyToCart);
router.patch("/:id/delete", deleteItemFromCart);
router.patch("/:id/clear", clearItemFromCart);
router.delete("/:id", deleteCart);

export default router;