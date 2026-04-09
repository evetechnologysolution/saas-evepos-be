import express from "express";
import { isAuth } from "../../middleware/auth.js";
import {
    getAllData,
    getAllLogs,
    getLogSummary,
    getLogSummaryV2,
    getTotalPoint,
    getDataById,
    addData,
    addDataByOrder,
    deleteData,
    migrateItemRef
} from "../../controllers/pos/progress.controller.js";

const router = express.Router();

router.get("/", isAuth, getAllData);
router.get("/log", isAuth, getAllLogs);
router.get("/log-summary", isAuth, getLogSummary);
router.get("/v2/log-summary", isAuth, getLogSummaryV2);
router.get("/total-point", isAuth, getTotalPoint);
router.get("/:id", isAuth, getDataById);
router.post("/", isAuth, addData);
router.post("/migrate-itemref", isAuth, migrateItemRef);
router.post("/:id", isAuth, addDataByOrder);
router.delete("/:id", isAuth, deleteData);

export default router;
