import mongoose from "mongoose";
import Tenant from "../../models/core/tenant.js";
import User from "../../models/core/user.js";
import Outlet from "../../models/core/outlet.js";
import Subs from "../../models/core/subscription.js";
import Invoice from "../../models/core/invoice.js";
import { convertToE164 } from "../../lib/textSetting.js";
import { ERROR_CONFIG } from "../../utils/errorMessages.js";

// GETTING ALL THE DATA
export const getAll = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let query = {};

        if (search) {
            const objectId = mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.createFromHexString(search) : null;

            query = {
                ...query,
                $or: [
                    { fullname: { $regex: search, $options: "i" } },
                    ...(objectId ? [{ _id: objectId }] : []),
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

        const listofData = await Tenant.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET A SPECIFIC DATA
export const getDataById = async (req, res) => {
    try {
        const spesificData = await Tenant.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editData = async (req, res) => {
    try {
        let objData = req.body;

        const spesificData = await Tenant.findById(req.params.id);
        if (!spesificData) return res.status(404).json({ status: 404, message: "Data not found" });

        // Build duplicate check query
        const duplicateQuery = [];

        if (objData.phone) {
            objData.phone = convertToE164(objData.phone);
            if (objData.phone !== spesificData.phone) {
                duplicateQuery.push({ phone: objData.phone });
            }
        }

        if (objData.email && objData.email !== spesificData.email) {
            duplicateQuery.push({ email: objData.email });
        }

        if (duplicateQuery.length > 0) {
            const exist = await Tenant.findOne({
                _id: { $ne: req.params.id },
                $or: duplicateQuery
            });

            if (exist) return res.status(400).json({ message: "Phone or email already exists" });
        }

        const updatedData = await Tenant.findOneAndUpdate(
            { _id: req.params.id },
            { $set: objData },
            { upsert: false, new: true }
        );

        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const completeData = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        let objData = req.body;

        const spesificData = await Tenant.findById(req.params.id).session(session);
        if (!spesificData) {
            throw new Error("DATA_NOT_FOUND");
        }

        const duplicateQuery = [];

        if (objData.phone) {
            objData.phone = convertToE164(objData.phone);
            if (objData.phone !== spesificData.phone) {
                duplicateQuery.push({ phone: objData.phone });
            }
        }

        if (objData.email && objData.email !== spesificData.email) {
            duplicateQuery.push({ email: objData.email });
        }

        if (duplicateQuery.length > 0) {
            const exist = await Tenant.findOne({
                _id: { $ne: req.params.id },
                $or: duplicateQuery
            });

            if (exist) {
                throw new Error("DUPLICATE_DATA");
            }
        }

        const newOutlet = new Outlet({
            name: objData?.businessName || "UTAMA",
            phone: objData?.phone || spesificData?.phone,
            email: objData?.email || spesificData?.email,
            address: objData?.address || spesificData?.address,
            province: objData?.provimce || spesificData?.provimce,
            city: objData?.city || spesificData?.city,
            district: objData?.district || spesificData?.district,
            subdistrict: objData?.subdistrict || spesificData?.subdistrict,
            zipCode: objData?.zipCode || spesificData?.zipCode,
            tenantRef: spesificData?._id,
        })


        const _subsId = new mongoose.Types.ObjectId();
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 14);

        const promises = [
            // UPDATE TENANT (selalu)
            Tenant.findOneAndUpdate(
                { _id: req.params.id },
                { $set: { ...objData, status: "active" } },
                { new: true, session }
            ),

            // UPDATE OUTLET (hanya sekali)
            Outlet.findOneAndUpdate(
                { tenantRef: spesificData?._id },
                {
                    $setOnInsert: {
                        name: objData?.businessName || "UTAMA",
                        phone: objData?.phone || spesificData?.phone,
                        email: objData?.email || spesificData?.email,
                        address: objData?.address || spesificData?.address,
                        province: objData?.province || spesificData?.province,
                        city: objData?.city || spesificData?.city,
                        district: objData?.district || spesificData?.district,
                        subdistrict: objData?.subdistrict || spesificData?.subdistrict,
                        zipCode: objData?.zipCode || spesificData?.zipCode,
                        tenantRef: spesificData?._id,
                    }
                },
                { upsert: true, new: true, session }
            ),

            // SUBS (trial hanya sekali)
            Subs.findOneAndUpdate(
                { tenantRef: spesificData?._id },
                {
                    $setOnInsert: {
                        _id: _subsId,
                        serviceRef: objData?.serviceRef,
                        tenantRef: spesificData?._id,
                        startDate: today,
                        endDate,
                        status: "trial"
                    }
                },
                { upsert: true, new: true, session }
            ),

            // INVOICE (trial invoice sekali)
            Invoice.findOneAndUpdate(
                { tenantRef: spesificData?._id, notes: "trial" },
                {
                    $setOnInsert: {
                        subsRef: _subsId,
                        tenantRef: spesificData?._id,
                        amount: 0,
                        payment: {
                            createdAt: today,
                            paidAt: today,
                            channel: "cash",
                        },
                        notes: "trial",
                        status: "paid",
                    }
                },
                { upsert: true, new: true, session }
            )
        ];

        const [tenantResult] = await Promise.all(promises);

        // Commit transaction
        await session.commitTransaction();

        return res.json({
            message: "Berhasil update data!",
            tenant: tenantResult
        });

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        const error = ERROR_CONFIG[err.message] || ERROR_CONFIG.INTERNAL_ERROR;

        return res.status(error.status).json({
            code: err.message,
            message: error.message
        });

    } finally {
        session.endSession();
    }
};

// DELETE A SPECIFIC DATA
export const deleteData = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenantId = req.params.id;

        // cek dulu apakah tenant ada
        const check = await Tenant.findById(tenantId).session(session);
        if (!check) {
            throw new Error("DATA_NOT_FOUND");
        }

        // Hapus paralel dalam satu transaction
        const [tenantResult, outletResult] = await Promise.all([
            Tenant.deleteOne({ _id: tenantId }).session(session),
            Outlet.deleteMany({ tenantRef: tenantId }).session(session),
            User.deleteMany({ tenantRef: tenantId }).session(session),
            Subs.deleteMany({ tenantRef: tenantId }).session(session),
            Invoice.deleteMany({ tenantRef: tenantId }).session(session),
        ]);

        await session.commitTransaction();

        return res.status(200).json({
            message: "Delete data success !",
            tenant: tenantResult,
            outlet: outletResult
        });

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        const error = ERROR_CONFIG[err.message] || ERROR_CONFIG.INTERNAL_ERROR;

        return res.status(error.status).json({
            code: err.message,
            message: error.message
        });

    } finally {
        session.endSession();
    }
};
