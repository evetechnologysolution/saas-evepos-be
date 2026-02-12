import mongoose from "mongoose";
import Outlet from "../../models/core/outlet.js";
import Tenant from "../../models/core/tenant.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, sort, primary, tenant } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (["yes", "1", "true"].includes(primary)) {
            qMatch.isPrimary = { $eq: true };
        }

        if (["no", "0", "false"].includes(primary)) {
            qMatch.isPrimary = { $ne: true };
        }

        if (tenant && mongoose.Types.ObjectId.isValid(tenant)) {
            qMatch.tenantRef = tenant;
        }

        if (search) {
            const objectId = mongoose.Types.ObjectId.isValid(search) ? search : null;

            const tenants = await Tenant.find({
                $or: [
                    { tenantId: { $regex: search, $options: "i" } },
                    { ownerName: { $regex: search, $options: "i" } },
                    { businessName: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            });
            const filteredTenant = tenants.map((item) => item._id);

            qMatch = {
                ...qMatch,
                $or: [
                    ...(objectId ? [{ _id: objectId }] : []),
                    { tenantRef: { $in: filteredTenant } },
                    { name: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
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
        const listofData = await Outlet.paginate(qMatch, options);
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
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const spesificData = await Outlet.findOne(qMatch).lean();
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

        const data = new Outlet(objData);
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
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        let objData = req.body;
        const updatedData = await Outlet.updateOne(qMatch, {
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
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const deletedData = await Outlet.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
