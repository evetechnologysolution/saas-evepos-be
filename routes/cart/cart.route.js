import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getCartByMember,
    addItemToCart,
    updateItemQtyToCart,
    deleteItemFromCart,
    clearItemFromCart,
    deleteCart,
} from "../../controllers/cart/cart.controller.js";

const router = express.Router();

router.get("/:id", isAuth, getCartByMember);
router.patch("/:id/add", isAuth, addItemToCart);
router.patch("/:id/update", isAuth, updateItemQtyToCart);
router.patch("/:id/delete", isAuth, deleteItemFromCart);
router.patch("/:id/clear", isAuth, clearItemFromCart);
router.delete("/:id", isAuth, deleteCart);

export default router;
