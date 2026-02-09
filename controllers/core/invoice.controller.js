import mongoose from "mongoose";
import Invoice from "../../models/core/invoice.js";
import Tenant from "../../models/core/tenant.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, sort, tenant } = req.query;
        let qMatch = {};

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
                    { invoiceId: { $regex: search, $options: "i" } },
                    { notes: { $regex: search, $options: "i" } },
                    { "payment.channel": { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }

        if (tenant && mongoose.Types.ObjectId.isValid(tenant)) {
            qMatch.tenantRef = tenant;
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
            lean: true,
            leanWithId: false,
            populate: [
                {
                    path: "tenantRef",
                    select: "tenantId ownerName businessName businessType phone email",
                },
                {
                    path: "serviceRef",
                    select: "name",
                },
            ],
        };
        const listofData = await Invoice.paginate(qMatch, options);
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
        const spesificData = await Invoice.findOne(qMatch)
            .populate([
                {
                    path: "tenantRef",
                    select: "tenantId ownerName businessName businessType phone email",
                },
                {
                    path: "serviceRef",
                    select: "name",
                },
            ])
            .lean();
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

        const data = new Invoice(objData);
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
        const updatedData = await Invoice.updateOne(qMatch, {
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
        const deletedData = await Invoice.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
