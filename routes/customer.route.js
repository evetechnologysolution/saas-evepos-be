import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllCustomer,
    getCustomerById,
    addCustomer,
    editCustomer,
    deleteCustomer
} from "../controllers/customer.controller.js";

const router = express.Router();

// GETTING ALL THE DATA
router.get("/", getAllCustomer);

// GET A SPECIFIC DATA
router.get("/:id", getCustomerById);

// CREATE NEW DATA
router.post("/", addCustomer);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editCustomer);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteCustomer);

export default router;