import mongoose from "mongoose";
import Subs from "../../models/core/subscription.js";
import Service from "../../models/core/service.js";
import Tenant from "../../models/core/tenant.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let query = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        if (search) {
            const objectId = mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.createFromHexString(search) : null;

            const services = await Service.find({
                $or: [...(objectId ? [{ _id: objectId }] : []), { name: { $regex: search, $options: "i" } }],
            });
            const filteredService = services.map((item) => item._id);

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

            query = {
                ...query,
                $or: [
                    ...(objectId ? [{ _id: objectId }] : []),
                    { subsId: { $regex: search, $options: "i" } },
                    { serviceRef: { $in: filteredService } },
                    { tenantRef: { $in: filteredTenant } },
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
            lean: true,
            leanWithId: false,
            populate: [
                {
                    path: "tenantRef",
                    select: "tenantId ownerName businessName businessType phone email",
                },
                {
                    path: "invoiceRef",
                    select: "-tenantRef -subsRef -serviceRef",
                },
            ],
        };

        const listofData = await Subs.paginate(query, options);
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
        let qMatch = { _id: req.params.id };
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const spesificData = await Subs.findOne(qMatch)
            .populate([
                {
                    path: "tenantRef",
                    select: "tenantId ownerName businessName businessType phone email",
                },
                {
                    path: "invoiceRef",
                    select: "-tenantRef -subsRef -serviceRef",
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
        if (req.userData?.tenantRef) {
            objData.tenantRef = req.userData?.tenantRef;
        }

        const data = new Subs(objData);
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
        let qMatch = { _id: req.params.id };
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        let objData = req.body;

        const spesificData = await Subs.findOne(qMatch);
        if (!spesificData) return res.status(404).json({ status: 404, message: "Data not found" });

        const updatedData = await Subs.findOneAndUpdate({ _id: req.params.id }, { $set: objData }, { upsert: false, new: true });

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
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const deletedData = await Subs.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
