import express from "express";
import {
    getDeliveryByPlaceId,
    getDeliveryByLocation
} from "../controllers/gmap.controller.js";

const router = express.Router();

router.post("/delivery", getDeliveryByPlaceId);
router.post("/delivery-by-location", getDeliveryByLocation);

export default router;