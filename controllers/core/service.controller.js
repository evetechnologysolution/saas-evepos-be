import mongoose from "mongoose";
import Service from "../../models/core/service.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let query = {};

        if (search) {
            const objectId = mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.createFromHexString(search) : null;

            query = {
                ...query,
                $or: [{ name: { $regex: search, $options: "i" } }, ...(objectId ? [{ _id: objectId }] : [])],
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

        const listofData = await Service.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getAllRaw = async (req, res) => {
    try {
        const listofData = await Service.find().sort({ listNumber: 1 }).lean();
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GET A SPECIFIC DATA
export const getDataById = async (req, res) => {
    try {
        const spesificData = await Service.findById(req.params.id);
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

        const data = new Service(objData);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
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
        let objData = req.body;

        const spesificData = await Service.findById(req.params.id);
        if (!spesificData) return res.status(404).json({ status: 404, message: "Data not found" });

        const updatedData = await Service.findOneAndUpdate({ _id: req.params.id }, { $set: objData }, { upsert: false, new: true });

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
        const deletedData = await Service.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
