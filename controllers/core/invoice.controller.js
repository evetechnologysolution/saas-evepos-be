import mongoose from "mongoose";
import Invoice from "../../models/core/invoice.js";
import Tenant from "../../models/core/tenant.js";
import { generatePayment } from "../../lib/xendit.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, tenant, status, sort } = req.query;
        let qMatch = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
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

        if (status) {
            const fixStatus = status.replace(":ne", "").trim();
            if (fixStatus) {
                const fixStatusArray = fixStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih
                if (status.includes(":ne")) {
                    qMatch.status = { $nin: fixStatusArray };
                } else {
                    qMatch.status = { $in: fixStatusArray };
                }
            }
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
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
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
        const objData = {
            ...req.body,
            ...(req.userData?.tenantRef && { tenantRef: req.userData.tenantRef }),
        };

        let invoiceUrl = "";

        // Cari invoice unpaid yang sama (misal berdasarkan tenant + service)
        let invoice = await Invoice.findOne({
            tenantRef: objData.tenantRef,
            status: "unpaid",
        });

        // Jika belum ada → buat baru
        if (!invoice) {
            invoice = await Invoice.create(objData);
        }

        // Generate payment jika ada tagihan
        if (invoice.billedAmount > 0) {
            const payment = await generatePayment({
                _id: invoice._id,
                paymentId: invoice._id,
                baseUrl: req.body?.baseUrl || "",
                customer: objData.customer,
                totalPrice: invoice.billedAmount,
            });

            if (payment.status === 200) {
                invoiceUrl = payment.invoiceUrl;

                invoice = await Invoice.findOneAndUpdate(
                    { _id: invoice._id, status: "unpaid" }, // pastikan masih unpaid
                    {
                        $set: {
                            payment: {
                                createdAt: new Date(),
                                paidAt: null,
                                channel: "xendit",
                                invoiceUrl,
                            },
                        },
                    },
                    { new: true },
                );
            }
        }

        return res.json({
            ...invoice.toObject(),
            invoiceUrl,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.fromEntries(Object.entries(err.errors).map(([key, val]) => [key, val.message]));

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

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

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
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
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
