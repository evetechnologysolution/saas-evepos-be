import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllData,
    getAllLogs,
    getLogSummary,
    getDataById,
    addData,
    addDataByOrder,
    deleteData,
} from "../../controllers/pos/progress.controller.js";

const router = express.Router();

router.get("/", isAuth, getAllData);
router.get("/log", isAuth, getAllLogs);
router.get("/log-summary", isAuth, getLogSummary);
router.get("/:id", isAuth, getDataById);
router.post("/", isAuth, addData);
router.post("/:id", isAuth, addDataByOrder);
router.delete("/:id", isAuth, deleteData);

export default router;
