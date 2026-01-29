import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllBalance,
    getCashFlow,
    getBalanceById,
    getExistBalance,
    addBalance,
    closeBalance,
    editBalance,
    deleteBalance,
} from "../../controllers/cashBalance/cashBalance.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllBalance);

// GET A SPECIFIC DATA
router.get("/cash-flow", isAuth, getCashFlow);

// GET A SPECIFIC DATA
router.get("/exist", isAuth, getExistBalance);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getBalanceById);

// CREATE NEW DATA
router.post("/", isAuth, addBalance);

// CLOSE DATA
router.post("/close", isAuth, closeBalance);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editBalance);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteBalance);

export default router;
