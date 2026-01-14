import axios from "axios";
import Setting from "../models/settings.js";

export const getDeliveryByPlaceId = async (req, res) => {
    try {
        const dataSetting = await Setting.findOne();

        let baseRate = 5000;
        let ratePerMinute = 1500;

        if (dataSetting) {
            baseRate = dataSetting?.deliveryBaseRate || 5000;
            ratePerMinute = dataSetting?.deliveryRatePerMinute || 1500;
        }

        const fromOrigin = "ChIJp1RBKrU9ei4RvTkA4HLYdzM"; // place id evewash

        if (!req.body.placeId) {
            return res.status(400).json({ message: "placeId is missing" });
        }

        const config = {
            method: "GET",
            url: `https://maps.googleapis.com/maps/api/directions/json?destination=place_id:${req.body.placeId}&origin=place_id:${fromOrigin}&key=${process.env.GMAP_API_KEY}`,
            headers: {}
        };

        const response = await axios(config);
        const estimate = response?.data?.routes[0]?.legs[0]?.duration?.text || "";
        const duration = response?.data?.routes[0]?.legs[0]?.duration?.value || 0;
        const distanceMeters = response?.data?.routes[0]?.legs[0]?.distance?.value || 0;
        const distanceKm = distanceMeters / 1000; // Convert meters to kilometers
        res.status(response.status).json(
            {
                estimate,
                duration,
                distanceKm: Number(distanceKm.toFixed(1)),
                deliveryPrice: baseRate + (Math.ceil(duration / 60) * ratePerMinute)
            }
        );
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to check delivery" });
    }
};

export const getDeliveryByLocation = async (req, res) => {
    try {
        const dataSetting = await Setting.findOne();

        let baseRate = 5000;
        let ratePerMinute = 1500;

        if (dataSetting) {
            baseRate = dataSetting?.deliveryBaseRate || 5000;
            ratePerMinute = dataSetting?.deliveryRatePerMinute || 1500;
        }

        const fromOrigin = { lat: -7.612115000000002, lng: 110.8145962 }; // Titik koordinat lokasi asal (evewash)

        // Pastikan latitude dan longitude tujuan disertakan dalam request
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ message: "Latitude and longitude are required!" });
        }

        // const config = {
        //     method: "GET",
        //     url: `https://maps.googleapis.com/maps/api/directions/json?destination=${lat},${lng}&origin=${fromOrigin.lat},${fromOrigin.lng}&key=${process.env.GMAP_API_KEY}`,
        //     headers: {}
        // };

        // const response = await axios(config);
        // const estimate = response?.data?.routes[0]?.legs[0]?.duration?.text || "";
        // const duration = response?.data?.routes[0]?.legs[0]?.duration?.value || 0;

        const config = {
            method: "GET",
            url: `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=latlng:${lat},${lng}&origins=latlng:${fromOrigin.lat},${fromOrigin.lng}&key=${process.env.GMAP_API_KEY}`,
            headers: {}
        };

        const response = await axios(config);
        const estimate = response?.data?.rows[0]?.elements[0]?.duration?.text || "";
        const duration = response?.data?.rows[0]?.elements[0]?.duration?.value || 0;
        const distanceMeters = response?.data?.routes[0]?.legs[0]?.distance?.value || 0;
        const distanceKm = distanceMeters / 1000; // Convert meters to kilometers

        res.status(response.status).json(
            {
                estimate,
                duration,
                distanceKm: Number(distanceKm.toFixed(1)),
                deliveryPrice: baseRate + (Math.ceil(duration / 60) * ratePerMinute),
                data: response?.data
            }
        );
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to check delivery" });
    }
};