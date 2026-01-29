import Survey from "../../models/core/survey.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let qMatch = {};

        if (search) {
            qMatch = {
                ...qMatch,
                name: { $regex: search, $options: "i" }, // option i for case insensitivity to match upper and lower cases.
            };
        }

        let sortObj = { createdAt: -1 }; // default
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
        };
        const listofData = await Survey.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getDataById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        const spesificData = await Survey.findOne(qMatch).lean();
        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// CREATE NEW DATA
export const addData = async (req, res) => {
    try {
        let objData = req.body;
        if (req.userData) {
            objData.tenantRef = req.userData?.tenantRef;
        }

        const data = new Survey(objData);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = {};
            Object.keys(err.errors).forEach((key) => {
                errors[key] = err.errors[key].message;
            });

            return errorResponse(res, {
                code: "VALIDATION_ERROR",
                message: "Validasi gagal",
                errors,
            });
        }

        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// UPDATE A SPECIFIC DATA
export const editData = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        let objData = req.body;
        const updatedData = await Survey.updateOne(qMatch, {
            $set: objData,
        });
        return res.json(updatedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// DELETE A SPECIFIC DATA
export const deleteData = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        const deletedData = await Survey.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
