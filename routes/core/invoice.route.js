import express from "express";
import { isAuthMaster, isAuth } from "../../middleware/auth.js";
import { getAll, getDataById, addData, editData, deleteData } from "../../controllers/core/invoice.controller.js";

const router = express.Router();

// ====================
// TENANT ROUTES
// ====================
router.use("/tenant", isAuth);

router.get("/tenant", getAll);
router.get("/tenant/:id", getDataById);
router.post("/tenant", addData);
router.patch("/tenant/:id", editData);

// ====================
// MASTER ROUTES
// ====================
router.use(isAuthMaster);

router.get("/", getAll);
router.get("/:id", getDataById);
router.post("/", addData);
router.patch("/:id", editData);
router.delete("/:id", deleteData);

export default router;
