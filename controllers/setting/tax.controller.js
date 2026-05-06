import Tax from "../../models/setting/tax.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllTax = async (req, res) => {
    try {
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
            if (req?.query?.outletRef) {
                qMatch.outletRef = req?.query?.outletRef;
            }
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
        let objData = req.body;

        if (req.userData) {
            // ================= NORMALIZE outletRef =================
            if (!objData.outletRef) {
                // tidak dikirim → pakai dari user
                objData.outletRef = [req.userData?.outletRef];
            } else if (!Array.isArray(objData.outletRef)) {
                // dikirim tapi bukan array → bungkus jadi array
                objData.outletRef = [objData.outletRef];
            }

            qMatch = {
                tenantRef: req.userData?.tenantRef,
                outletRef: { $in: objData.outletRef },
            };
        }

        const data = await Tax.findOneAndUpdate(
            qMatch,
            objData,
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
