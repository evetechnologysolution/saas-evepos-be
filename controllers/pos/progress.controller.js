import mongoose from "mongoose";
import Progress from "../../models/pos/progress.js";
import Order from "../../models/pos/order.js";
import { convertToE164 } from "../../lib/textSetting.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllData = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search)
                ? new mongoose.Types.ObjectId(search)
                : null;

            const checkOrder = await Order.find({
                $or: [
                    { orderId: { $regex: search, $options: "i" } },
                    { "customer.memberId": { $regex: search, $options: "i" } },
                    { "customer.name": { $regex: search, $options: "i" } },
                    {
                        "customer.phone": {
                            $regex: isNaN(search)
                                ? search
                                : convertToE164(search),
                            $options: "i",
                        },
                    },
                    { "customer.email": { $regex: search, $options: "i" } },
                ],
            });
            const filteredOrder = checkOrder.map((item) => item._id);

            qMatch = {
                ...qMatch,
                $or: [
                    { latestStatus: { $regex: search, $options: "i" } },
                    { orderRef: { $in: filteredOrder } },
                    ...(fixedId ? [{ _id: fixedId }] : []),
                ], // option i for case insensitivity to match upper and lower cases.
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
            populate: [
                { path: "orderRef", select: "orderId" },
                { path: "log.staffRef", select: "fullname" },
            ],
            lean: true,
            leanWithId: false,
        };
        const listofData = await Progress.paginate(qMatch, options);
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
            qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Progress.findOne(qMatch)
            .populate([
                { path: "orderRef", select: "orderId" },
                { path: "log.staffRef", select: "fullname" },
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
        const objData = { ...req.body };

        if (req.userData) {
            objData.tenantRef = req.userData.tenantRef;
            if (req.userData?.outletRef) {
                objData.outletRef = req.userData.outletRef;
            }
        }

        if (req.userData?._id && objData.log) {
            if (Array.isArray(objData.log)) {
                // Jika log adalah array, pastikan setiap item punya staff
                objData.log = objData.log.map((item) => ({
                    ...item,
                    staffRef: item?.staff || req.userData._id,
                }));
            } else if (
                typeof objData.log === "object" &&
                Object.keys(objData.log).length > 0
            ) {
                // Jika log adalah single object, tambahkan staff jika belum ada
                objData.log = [
                    {
                        ...objData.log,
                        staffRef: objData.log.staffRef || req.userData._id,
                    },
                ];
            }
        }

        const data = new Progress(req.body);
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

// CREATE DATA BY ORDER
export const addDataByOrder = async (req, res) => {
    try {
        const { lockerName, ...objData } = req.body;
        const update = {};

        if (req.userData) {
            objData.tenantRef = req.userData.tenantRef;
            if (req.userData?.outletRef) {
                objData.outletRef = req.userData.outletRef;
            }
        }

        // Tangani log jika ada
        if (objData.log) {
            const staffId = req.userData?._id;

            let processedLog = [];

            if (Array.isArray(objData.log) && objData.log.length > 0) {
                // Array: tambahkan staff jika belum ada
                processedLog = objData.log.map((item) => ({
                    ...item,
                    staffRef: item?.staff || staffId,
                }));
            } else if (
                typeof objData.log === "object" &&
                Object.keys(objData.log).length > 0
            ) {
                // Object tunggal: pastikan jadi array dan staff ditambahkan jika belum ada
                processedLog = [
                    {
                        ...objData.log,
                        staffRef: objData.log.staffRef || staffId,
                    },
                ];
            }

            if (processedLog.length > 0) {
                update.$push = {
                    log: {
                        $each: processedLog,
                    },
                };
            }

            // Hapus log dari objData agar tidak ikut di-$set
            delete objData.log;
        }

        // Tambahkan field lain ke $set
        if (Object.keys(objData).length > 0) {
            update.$set = objData;
        }

        // ================= QUERY =================
        const qMatch = {
            _id: req.params.id,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        const qProgress = {
            orderRef: req.params.id,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        // Jalankan update bersamaan
        const [updatedProgress] = await Promise.all([
            Progress.findOneAndUpdate(qProgress, update, {
                new: true,
                upsert: true,
            }),
            lockerName
                ? Order.updateOne(qMatch, { $set: { lockerName } })
                : Promise.resolve(null), // skip jika tidak ada lockerName
        ]);

        if (!updatedProgress) {
            return res
                .status(404)
                .json({ message: "Progress not found for this order ID." });
        }

        return res.json(updatedProgress);
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
        const objData = { ...req.body };
        const update = {};

        if (req.userData) {
            objData.tenantRef = req.userData.tenantRef;
            if (req.userData?.outletRef) {
                objData.outletRef = req.userData.outletRef;
            }
        }

        // Tangani log jika ada
        if (objData.log) {
            const staffId = req.userData?._id;

            let processedLog = [];

            if (Array.isArray(objData.log) && objData.log.length > 0) {
                // Array: tambahkan staff jika belum ada
                processedLog = objData.log.map((item) => ({
                    ...item,
                    staffRef: item?.staff || staffId,
                }));
            } else if (
                typeof objData.log === "object" &&
                Object.keys(objData.log).length > 0
            ) {
                // Object tunggal: pastikan jadi array dan staff ditambahkan jika belum ada
                processedLog = [
                    {
                        ...objData.log,
                        staffRef: objData.log.staffRef || staffId,
                    },
                ];
            }

            if (processedLog.length > 0) {
                update.$push = {
                    log: {
                        $each: processedLog,
                    },
                };
            }

            // Hapus log dari objData agar tidak ikut di-$set
            delete objData.log;
        }

        // Sisanya masuk ke $set
        if (Object.keys(objData).length > 0) {
            update.$set = objData;
        }

        const updatedData = await Progress.updateOne(
            { _id: req.params.id },
            update,
        );

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
        const { id } = req.params;

        // ================= QUERY =================
        const qMatch = {
            _id: id,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        const qProgress = {
            progress: id,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        // ================= EXECUTE PARALLEL =================
        const [deletedData] = await Promise.all([
            Progress.deleteOne(qMatch),
            Order.findOneAndUpdate(qProgress, { $set: { progress: null } }),
        ]);

        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
