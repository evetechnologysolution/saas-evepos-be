import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
  addTicket,
  updateTicket,
  deleteTicket,
  getAllTicket,
  getTicketById,
} from "../../controllers/ticket/ticket.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", isAuth, getAllTicket);

// GET A SPECIFIC DATA
router.get("/:id", isAuth, getTicketById);

// CREATE NEW DATA
router.post("/", isAuth, addTicket);

// UPDATE A SPECIFIC DATA
router.patch("/:id", isAuth, updateTicket);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteTicket);

export default router;
