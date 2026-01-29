import Tax from "../../models/setting/tax.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllTax = async (req, res) => {
    try {
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const listofData = await Tax.findOne(qMatch);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// CREATE NEW DATA
export const saveTax = async (req, res) => {
    try {
        let qMatch = { _id: { $ne: null } };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const data = await Tax.findOneAndUpdate(
            qMatch,
            req.body,
            { new: true, upsert: true },
        );
        return res.json(data);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
