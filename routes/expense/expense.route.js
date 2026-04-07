import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
  getAllExpense,
  getExpenseTotal,
  getExpenseById,
  addExpense,
  editExpense,
  deleteExpense,
} from "../../controllers/expense/expense.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllExpense);

// GETTING ALL THE DATA
router.get("/total", isAuth, getExpenseTotal);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getExpenseById);

// CREATE NEW DATA
router.post("/", isAuth, addExpense);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, editExpense);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteExpense);

export default router;
