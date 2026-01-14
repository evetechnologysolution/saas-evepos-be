import express from "express";
import { isAuth } from "../middleware/auth.js";
import {
    getAllData,
    getDataById,
    addData,
    addDataByOrder,
    editData,
    deleteData
} from "../controllers/progress.controller.js";

const router = express.Router();

router.get("/", getAllData);
router.get("/:id", getDataById);
router.post("/", isAuth, addData);
router.post("/:id", isAuth, addDataByOrder);
router.post("/:id/bypass", addDataByOrder);
router.patch("/:id", isAuth, editData);
router.delete("/:id", isAuth, deleteData);

export default router;