import mongoose from "mongoose";
import Progress from "../models/progress.js";
import Order from "../models/order.js";
import { convertToE164 } from "../lib/textSetting.js";

// GETTING ALL THE DATA
export const getAllData = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let query = {};
        if (search) {
            query = {
                ...query,
                latestStatus: { $regex: search, $options: "i" }, // option i for case insensitivity to match upper and lower cases.
            };
        };
        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search)
                ? new mongoose.Types.ObjectId(search)
                : null;

            const checkOrder = await Order.find({
                $or: [
                    { orderId: { $regex: search, $options: "i" } },
                    { "customer.memberId": { $regex: search, $options: "i" } },
                    { "customer.name": { $regex: search, $options: "i" } },
                    { "customer.phone": { $regex: isNaN(search) ? search : convertToE164(search), $options: "i" } },
                    { "customer.email": { $regex: search, $options: "i" } }
                ],
            });
            const filteredOrder = checkOrder.map((item) => item._id);

            query = {
                ...query,
                $or: [
                    { latestStatus: { $regex: search, $options: "i" } },
                    { orderRef: { $in: filteredOrder } },
                    ...(fixedId ? [{ _id: fixedId }] : []),
                ],  // option i for case insensitivity to match upper and lower cases.
            };
        };
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { name: 1 },
            populate: [
                { path: "orderRef", select: "orderId" },
                { path: "log.staff", select: "fullname" }
            ],
            lean: true,
            leanWithId: false
        }
        const listofData = await Progress.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getDataById = async (req, res) => {
    try {
        const spesificData = await Progress.findById(req.params.id)
            .populate([
                { path: "orderRef", select: "orderId" },
                { path: "log.staff", select: "fullname" }
            ]).lean();
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addData = async (req, res) => {
    try {
        const objData = { ...req.body };

        if (req.userData?._id && objData.log) {
            if (Array.isArray(objData.log)) {
                // Jika log adalah array, pastikan setiap item punya staff
                objData.log = objData.log.map(item => ({
                    ...item,
                    staff: item?.staff || req.userData._id
                }));
            } else if (typeof objData.log === "object" && Object.keys(objData.log).length > 0) {
                // Jika log adalah single object, tambahkan staff jika belum ada
                objData.log = [{
                    ...objData.log,
                    staff: objData.log.staff || req.userData._id
                }];
            }
        }

        const data = new Progress(req.body);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE DATA BY ORDER
export const addDataByOrder = async (req, res) => {
    try {
        const { lockerName, ...objData } = req.body;
        const update = {};

        // Tangani log jika ada
        if (objData.log) {
            const staffId = req.userData?._id;

            let processedLog = [];

            if (Array.isArray(objData.log) && objData.log.length > 0) {
                // Array: tambahkan staff jika belum ada
                processedLog = objData.log.map(item => ({
                    ...item,
                    staff: item?.staff || staffId
                }));
            } else if (typeof objData.log === "object" && Object.keys(objData.log).length > 0) {
                // Object tunggal: pastikan jadi array dan staff ditambahkan jika belum ada
                processedLog = [{
                    ...objData.log,
                    staff: objData.log.staff || staffId
                }];
            }

            if (processedLog.length > 0) {
                update.$push = {
                    log: {
                        $each: processedLog
                    }
                };
            }

            // Hapus log dari objData agar tidak ikut di-$set
            delete objData.log;
        }

        // Tambahkan field lain ke $set
        if (Object.keys(objData).length > 0) {
            update.$set = objData;
        }

        // Jalankan update bersamaan
        const [updatedOrder, updatedProgress] = await Promise.all([
            lockerName
                ? Order.updateOne({ _id: req.params.id }, { $set: { lockerName } })
                : Promise.resolve(null), // skip jika tidak ada lockerName
            Progress.findOneAndUpdate(
                { order: req.params.id },
                update,
                { new: true, upsert: true }
            )
        ]);

        if (!updatedProgress) {
            return res.status(404).json({ message: "Progress not found for this order ID." });
        }

        return res.json(updatedProgress);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editData = async (req, res) => {
    try {
        const objData = { ...req.body };
        const update = {};

        // Tangani log jika ada
        if (objData.log) {
            const staffId = req.userData?._id;

            let processedLog = [];

            if (Array.isArray(objData.log) && objData.log.length > 0) {
                // Array: tambahkan staff jika belum ada
                processedLog = objData.log.map(item => ({
                    ...item,
                    staff: item?.staff || staffId
                }));
            } else if (typeof objData.log === "object" && Object.keys(objData.log).length > 0) {
                // Object tunggal: pastikan jadi array dan staff ditambahkan jika belum ada
                processedLog = [{
                    ...objData.log,
                    staff: objData.log.staff || staffId
                }];
            }

            if (processedLog.length > 0) {
                update.$push = {
                    log: {
                        $each: processedLog
                    }
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
            update
        );

        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteData = async (req, res) => {
    try {
        // Jika ada Order yang referensikan Progress ini, hapus relasinya (set progress ke null)
        await Order.findOneAndUpdate(
            { progress: req.params.id },
            { $set: { progress: null } }
        );

        const deletedData = await Progress.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};