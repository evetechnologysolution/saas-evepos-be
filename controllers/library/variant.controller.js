import Variant from "../../models/library/variant.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllVariant = async (req, res) => {
    try {
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const listofData = await Variant.find(qMatch).lean();
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

// GETTING ALL THE DATA
export const getPaginateVariant = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                name: { $regex: search, $options: 'i' }, // option i for case insensitivity to match upper and lower cases.
            };
        };

        let sortObj = { name: 1 }; // default
        if (sort && sort.trim() !== "") {
            sortObj = {};
            sort.split(",").forEach((rule) => {
                const [field, type] = rule.split(":");
                sortObj[field] = type === "asc" ? 1 : -1;
            });
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
        }
        const listofData = await Variant.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

// UPDATE A SPECIFIC DATA BY ID
export const getVariantById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Variant.findOne(qMatch);
        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

// CREATE NEW DATA
export const addVariant = async (req, res) => {
    try {
        let objData = req.body;
        if (req.userData) {
            objData.tenantRef = req.userData?.tenantRef;
            if (req.userData?.outletRef) {
                objData.outletRef = [req.userData.outletRef];
            }
        }
        const data = new Variant(objData);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

// UPDATE A SPECIFIC DATA
export const editVariant = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const updatedData = await Variant.updateOne(
            qMatch,
            {
                $set: req.body
            }
        );
        return res.json(updatedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};

// DELETE A SPECIFIC DATA
export const deleteVariant = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const deletedData = await Variant.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
};