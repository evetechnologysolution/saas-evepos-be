import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllExpense,
    getExpenseTotal,
    getExpenseById,
    addExpense,
    editExpense,
    deleteExpense
} from "../controllers/expense.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllExpense);

// GETTING ALL THE DATA
router.get("/total", getExpenseTotal);

// GET A SPECIFIC DATA
router.get("/:id", getExpenseById);

// CREATE NEW DATA
router.post("/", addExpense);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editExpense);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteExpense);

export default router;