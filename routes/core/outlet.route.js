import express from "express";
import { isAuth } from "../../middleware/auth.js";
import { getAll, getDataById, addData, editData, deleteData } from "../../controllers/core/outlet.controller.js";

const router = express.Router();

router.get("/", isAuth, getAll);
router.get("/:id", isAuth, getDataById);
router.post("/", isAuth, addData);
router.patch("/:id", isAuth, editData);
router.delete("/:id", isAuth, deleteData);

export default router;
