import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllBalance,
    getCashFlow,
    getBalanceById,
    getExistBalance,
    addBalance,
    closeBalance,
    editBalance,
    deleteBalance
} from "../controllers/cashBalance.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllBalance);

// GET A SPECIFIC DATA
router.get("/cash-flow", getCashFlow);

// GET A SPECIFIC DATA
router.get("/exist", getExistBalance);

// GET A SPECIFIC DATA
router.get("/:id", getBalanceById);

// CREATE NEW DATA
router.post("/", addBalance);

// CLOSE DATA
router.post("/close", closeBalance);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editBalance);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteBalance);

export default router;