import mongoose from "mongoose";
import multer from "multer";
import Order from "../../models/pos/order.js";
import Member from "../../models/member/member.js";
// import MemberVoucher from "../../models/voucherMember.js";
import Balance from "../../models/cashBalance.js";
import { generateRandomId } from "../../lib/generateRandom.js";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { convertToE164 } from "../../lib/textSetting.js";

// GETTING ALL THE DATA
export const getAllOrder = async (req, res) => {
    try {
        const {
            page,
            perPage,
            search,
            printCount,
            printLaundry,
            status,
            progressStatus,
            pickup,
            orderType,
            start,
            end,
            paidStart,
            paidEnd,
            sortBy,
            sortType,
        } = req.query;

        let qMatch = { status: { $ne: "backlog" } };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { _id: { $regex: search, $options: "i" } },
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
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }
        if (printCount) {
            const printCountNumber = Number(printCount);
            if (!isNaN(printCountNumber)) {
                qMatch.printCount = { $gt: printCountNumber };
            }
        }
        if (printLaundry) {
            const printLaundryNumber = Number(printLaundry);
            if (!isNaN(printLaundryNumber)) {
                qMatch.printLaundry = { $gt: printLaundryNumber };
            }
        }
        if (status) {
            const fixStatus = status.replace(":ne", "").trim();
            if (fixStatus) {
                const fixStatusArray = fixStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih

                if (status.includes(":ne")) {
                    qMatch.status = { $nin: [...fixStatusArray, "backlog"] };
                } else {
                    qMatch.status = { $in: fixStatusArray };
                }
            }
        }
        if (progressStatus) {
            const fixProgressStatus = progressStatus.replace(":ne", "").trim();
            if (fixProgressStatus) {
                const fixProgressStatusArray = fixProgressStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih
                if (progressStatus.includes(":ne")) {
                    qMatch.progressStatus = { $nin: fixProgressStatusArray };
                } else {
                    qMatch.progressStatus = { $in: fixProgressStatusArray };
                }
            }
        }
        if (pickup) {
            qMatch.pickUpStatus = pickup;
        }
        if (orderType) {
            qMatch.orderType = orderType;
        }
        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            qMatch = {
                ...qMatch,
                date: {
                    $gte: fixStart,
                    $lte: fixEnd,
                },
            };
        }
        if (paidStart) {
            const pStart = new Date(paidStart);
            pStart.setHours(0, 0, 0, 0);
            const fixPaidStart = new Date(pStart.toISOString()); // Konversi ke UTC string

            const pEnd = new Date(paidEnd || paidStart);
            pEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixPaidEnd = new Date(pEnd.toISOString());

            qMatch = {
                ...qMatch,
                paymentDate: {
                    $gte: fixPaidStart,
                    $lte: fixPaidEnd,
                },
            };
        }

        const sortField = sortBy || "date";
        const sortDirection = sortType === "asc" ? 1 : -1;

        const options = {
            populate: [
                {
                    path: "customerRef",
                    select: "memberId name firstName lastName phone notes point",
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { [sortField]: sortDirection },
        };
        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getDeliveryOrder = async (req, res) => {
    try {
        const {
            page,
            perPage,
            search,
            printCount,
            printLaundry,
            status,
            progressStatus,
            pickup,
            start,
            end,
            paidStart,
            paidEnd,
            sortBy,
            sortType,
        } = req.query;

        let qMatch = { orderType: "delivery" };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { _id: { $regex: search, $options: "i" } },
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
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }
        if (printCount) {
            const printCountNumber = Number(printCount);
            if (!isNaN(printCountNumber)) {
                qMatch.printCount = { $gt: printCountNumber };
            }
        }
        if (printLaundry) {
            const printLaundryNumber = Number(printLaundry);
            if (!isNaN(printLaundryNumber)) {
                qMatch.printLaundry = { $gt: printLaundryNumber };
            }
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
        if (progressStatus) {
            const fixProgressStatus = progressStatus.replace(":ne", "").trim();
            if (fixProgressStatus) {
                const fixProgressStatusArray = fixProgressStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih
                if (progressStatus.includes(":ne")) {
                    qMatch.progressStatus = { $nin: fixProgressStatusArray };
                } else {
                    qMatch.progressStatus = { $in: fixProgressStatusArray };
                }
            }
        }
        if (pickup) {
            qMatch.pickUpStatus = pickup;
        }
        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            qMatch = {
                ...qMatch,
                date: {
                    $gte: fixStart,
                    $lte: fixEnd,
                },
            };
        }
        if (paidStart) {
            const pStart = new Date(paidStart);
            pStart.setHours(0, 0, 0, 0);
            const fixPaidStart = new Date(pStart.toISOString()); // Konversi ke UTC string

            const pEnd = new Date(paidEnd || paidStart);
            pEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixPaidEnd = new Date(pEnd.toISOString());

            qMatch = {
                ...qMatch,
                paymentDate: {
                    $gte: fixPaidStart,
                    $lte: fixPaidEnd,
                },
            };
        }

        const sortField = sortBy || "date";
        const sortDirection = sortType === "asc" ? 1 : -1;

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { [sortField]: sortDirection },
        };

        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getTrackOrder = async (req, res) => {
    try {
        const {
            page,
            perPage,
            search,
            status,
            progressStatus,
            pickup,
            start,
            end,
            paidStart,
            paidEnd,
            sortBy,
            sortType,
        } = req.query;

        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { _id: { $regex: search, $options: "i" } },
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
                ], // option i for case insensitivity to match upper and lower cases.
            };
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
        if (progressStatus) {
            const fixProgressStatus = progressStatus.replace(":ne", "").trim();
            if (fixProgressStatus) {
                const fixProgressStatusArray = fixProgressStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih
                if (progressStatus.includes(":ne")) {
                    qMatch.progressStatus = { $nin: fixProgressStatusArray };
                } else {
                    qMatch.progressStatus = { $in: fixProgressStatusArray };
                }
            }
        }
        if (pickup) {
            qMatch.pickUpStatus = pickup;
        }
        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            qMatch = {
                ...qMatch,
                date: {
                    $gte: fixStart,
                    $lte: fixEnd,
                },
            };
        }
        if (paidStart) {
            const pStart = new Date(paidStart);
            pStart.setHours(0, 0, 0, 0);
            const fixPaidStart = new Date(pStart.toISOString()); // Konversi ke UTC string

            const pEnd = new Date(paidEnd || paidStart);
            pEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixPaidEnd = new Date(pEnd.toISOString());

            qMatch = {
                ...qMatch,
                paymentDate: {
                    $gte: fixPaidStart,
                    $lte: fixPaidEnd,
                },
            };
        }

        const sortField = sortBy || "date";
        const sortDirection = sortType === "asc" ? 1 : -1;

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { [sortField]: sortDirection },
        };

        const listofData = await Order.paginate(qMatch, options);

        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getCountTrackOrder = async (req, res) => {
    try {
        const { start, end } = req.query;

        const dStart = start ? new Date(start) : new Date();
        const dEnd = new Date(end ? end : dStart);

        dStart.setHours(0, 0, 0, 0);
        const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string
        dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
        const fixEnd = new Date(dEnd.toISOString());

        const result = await Order.aggregate([
            {
                $match: {
                    date: {
                        $gte: fixStart,
                        $lte: fixEnd,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $cond: [{ $eq: ["$firstOrder", true] }, "new", "old"],
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    new: {
                        $sum: {
                            $cond: [{ $eq: ["$_id", "new"] }, "$count", 0],
                        },
                    },
                    old: {
                        $sum: {
                            $cond: [{ $eq: ["$_id", "old"] }, "$count", 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    new: 1,
                    old: 1,
                },
            },
        ]);

        // Send response
        res.status(200).json(
            result?.length > 0 ? result[0] : { new: 0, old: 0 },
        );
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING ORDER BY MEMBER
export const getOrderByMember = async (req, res) => {
    try {
        const {
            page,
            perPage,
            search,
            status,
            progressStatus,
            pickup,
            orderType,
        } = req.query;

        let qMatch = {
            "customer.memberId": req.params.id,
            // status: { $ne: "backlog" }
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { _id: { $regex: search, $options: "i" } },
                    { orderId: { $regex: search, $options: "i" } },
                ], // option i for case insensitivity to match upper and lower cases.
            };
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
        if (progressStatus) {
            const fixProgressStatus = progressStatus.replace(":ne", "").trim();
            if (fixProgressStatus) {
                const fixProgressStatusArray = fixProgressStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih
                if (progressStatus.includes(":ne")) {
                    qMatch.progressStatus = { $nin: fixProgressStatusArray };
                } else {
                    qMatch.progressStatus = { $in: fixProgressStatusArray };
                }
            }
        }
        if (pickup) {
            qMatch.pickUpStatus = pickup;
        }
        if (orderType) {
            qMatch.orderType = orderType;
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        };
        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING PAID DATA
export const getPaidOrder = async (req, res) => {
    try {
        const {
            page,
            perPage,
            search,
            start,
            end,
            paidStart,
            paidEnd,
            sortBy,
            sortType,
        } = req.query;

        let qMatch = {
            $or: [
                { status: { $regex: "paid", $options: "i" } },
                { status: { $regex: "refund", $options: "i" } },
            ],
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { _id: { $regex: search, $options: "i" } },
                    { orderId: { $regex: search, $options: "i" } },
                    { tableName: { $regex: search, $options: "i" } },
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }
        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            qMatch = {
                ...qMatch,
                date: {
                    $gte: fixStart,
                    $lte: fixEnd,
                },
            };
        }
        if (paidStart) {
            const pStart = new Date(paidStart);
            pStart.setHours(0, 0, 0, 0);
            const fixPaidStart = new Date(pStart.toISOString()); // Konversi ke UTC string

            const pEnd = new Date(paidEnd || paidStart);
            pEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixPaidEnd = new Date(pEnd.toISOString());

            qMatch = {
                ...qMatch,
                paymentDate: {
                    $gte: fixPaidStart,
                    $lte: fixPaidEnd,
                },
            };
        }

        const sortField = sortBy || "date";
        const sortDirection = sortType === "asc" ? 1 : -1;

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { [sortField]: sortDirection },
        };

        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING CLOSE CASHIER
export const getCloseCashierOrder = async (req, res) => {
    try {
        const { start, end } = req.query;
        let qMatch = {
            $or: [
                { status: { $regex: "paid", $options: "i" } },
                { status: { $regex: "refund", $options: "i" } },
            ],
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (start && end) {
            qMatch = {
                ...qMatch,
                date: {
                    $gte: start,
                    $lte: end,
                },
            };
        }
        const listofData = await Order.find(qMatch)
            .select([
                "date",
                "orderId",
                "orders",
                "taxPercentage",
                "tax",
                "serviceChargePercentage",
                "serviceCharge",
                "discount",
                "discountPrice",
                "billedAmount",
                "status",
            ])
            .sort({ date: 1 });

        // Hitung total dokumen
        const totalDocuments = listofData.length;

        // Hitung jumlah billedAmount
        const totalBilledAmount = listofData.reduce(
            (total, order) => total + order.billedAmount,
            0,
        );

        return res.json({
            docs: listofData,
            totalDocs: totalDocuments,
            totalBilledAmount: totalBilledAmount,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING EXPORT ORDER
export const getExportOrder = async (req, res) => {
    try {
        const { search, start, end, paidStart, paidEnd, sortBy, sortType } =
            req.query;
        let qMatch = {
            $or: [
                { status: { $regex: "paid", $options: "i" } },
                { status: { $regex: "refund", $options: "i" } },
            ],
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { _id: { $regex: search, $options: "i" } },
                    { orderId: { $regex: search, $options: "i" } },
                    { tableName: { $regex: search, $options: "i" } },
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }
        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            qMatch = {
                ...qMatch,
                date: {
                    $gte: fixStart,
                    $lte: fixEnd,
                },
            };
        }
        if (paidStart) {
            const pStart = new Date(paidStart);
            pStart.setHours(0, 0, 0, 0);
            const fixPaidStart = new Date(pStart.toISOString()); // Konversi ke UTC string

            const pEnd = new Date(paidEnd || paidStart);
            pEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixPaidEnd = new Date(pEnd.toISOString());

            qMatch = {
                ...qMatch,
                paymentDate: {
                    $gte: fixPaidStart,
                    $lte: fixPaidEnd,
                },
            };
        }

        const sortField = sortBy || "date";
        const sortDirection = sortType === "asc" ? 1 : -1;

        const listofData = await Order.find(qMatch).sort({
            [sortField]: sortDirection,
        });

        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING SAVED BILL
export const getSavedBill = async (req, res) => {
    try {
        const listofData = await Order.find().where("status").equals("pending");
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING UNFINISHED ORDER
export const getUnfinishedOrder = async (req, res) => {
    try {
        const data = await Order.findOne({
            $or: [{ status: "pending" }, { status: "half paid" }],
        });
        return res.json(data);
    } catch (err) {
        res.json({ message: err.message });
    }
};

// GETTING A SPECIFIC DATA BY ID
export const getOrderById = async (req, res) => {
    try {
        const spesificData = await Order.findOne({
            $or: [{ _id: req.params.id }, { orderId: req.params.id }],
        })
            .populate([
                {
                    path: "customerRef",
                    select: "memberId name firstName lastName phone notes point",
                },
                {
                    path: "progressRef",
                    select: "latestStatus log",
                    populate: {
                        path: "log.staff",
                        select: "fullname",
                    },
                },
            ])
            .lean();

        if (!spesificData) {
            return res.status(404).json({ message: "Data not found" });
        }

        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getOrderProgressById = async (req, res) => {
    try {
        const spesificData = await Order.findOne({
            $or: [{ _id: req.params.id }, { orderId: req.params.id }],
        })
            .select("orderId date customer orders progressRef")
            .populate([
                {
                    path: "progressRef",
                    select: "latestStatus log",
                    populate: {
                        path: "log.staff",
                        select: "fullname",
                    },
                },
            ])
            .lean();

        if (!spesificData) {
            return res.status(404).json({ message: "Data not found" });
        }

        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addOrder = async (req, res) => {
    try {
        imageUpload.single("invoiceImg")(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Failed to upload image",
                });
            } else if (err) {
                return res.status(400).json({
                    status: "Failed",
                    message: err.message.message,
                });
            }

            let objData = req.body;

            if (req.userData) {
                objData.tenantRef = req.userData?.tenantRef;
                if (req.userData?.outletRef) {
                    objData.outletRef = req.userData.outletRef;
                }
            }

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                objData = Object.assign(objData, {
                    invoiceImg: {
                        image: cloud.secure_url,
                        imageId: cloud.public_id,
                    },
                });
            }

            if (!req.body?._id) {
                objData._id = new mongoose.Types.ObjectId().toString();
            }

            if (req.body?.customerString) {
                objData.customer = JSON.parse(req.body.customerString);
            }

            if (req.body?.ordersString) {
                objData.orders = JSON.parse(req.body.ordersString);
            }

            let checkMember = null;

            if (objData?.customer?.address) {
                objData.isOnline = true;
            }

            if (objData?.customer?.phone) {
                objData.customer.phone = convertToE164(objData.customer.phone);
                let qMember = { phone: objData.customer.phone };
                if (req.userData) {
                    qMember.tenantRef = req.userData?.tenantRef;
                }

                checkMember = await Member.findOneAndUpdate(
                    qMember,
                    { $set: objData.customer },
                    { new: true, upsert: false },
                );

                if (checkMember) {
                    let qFirstOrder = {
                        "customer.memberId": checkMember.memberId,
                    };
                    if (req.userData) {
                        qFirstOrder.tenantRef = req.userData?.tenantRef;
                    }
                    objData.customer.memberId = checkMember.memberId;

                    const hasPreviousOrder = await Order.exists(qFirstOrder);
                    if (!hasPreviousOrder) {
                        objData.firstOrder = true; // pertama order
                    }
                }

                if (!checkMember && objData?.customer?.isNew) {
                    // jika member baru
                    const currYear = new Date().getFullYear();
                    const memId = `EM${currYear}${generateRandomId()}`;
                    objData.customer = {
                        ...objData.customer,
                        memberId: memId,
                        phone:
                            objData.customer.phone === "62" ||
                            objData.customer.phone === "0"
                                ? memId
                                : objData.customer.phone,
                        tenantRef: req?.userData?.tenantRef || null,
                    };
                    const custData = new Member(objData.customer);
                    checkMember = await custData.save();

                    objData.firstOrder = true; // pertama order
                }
            }

            if (objData.voucherCode) {
                if (
                    typeof objData.voucherCode === "string" &&
                    objData.voucherCode.trim() !== ""
                ) {
                    objData.voucherCode = [objData.voucherCode];
                } else if (!Array.isArray(objData.voucherCode)) {
                    objData.voucherCode = [];
                }
            }

            // // Cek dan simpan penggunaan voucher jika ada
            // if (checkMember && Array.isArray(objData.voucherCode) && objData.voucherCode.length > 0) {
            //     await MemberVoucher.updateMany(
            //         { voucherCode: { $in: objData.voucherCode } },
            //         { $set: { isUsed: true, usedAt: new Date() } }
            //     );
            // }

            if (objData?.status && objData?.billedAmount) {
                const statusPay = ["paid", "refund"];
                // const settings = await Setting.findOne();
                // if (settings.cashBalance && statusPay.includes(objData.status)) {
                if (objData?.status === "paid" && !objData.paymentDate) {
                    objData.paymentDate = new Date();
                }
                if (statusPay.includes(objData.status)) {
                    let increase = {
                        sales: objData.billedAmount,
                    };

                    if (objData.serviceCharge) {
                        increase = {
                            ...increase,
                            serviceCharge: objData.serviceCharge,
                        };
                    }
                    if (objData.tax) {
                        increase = {
                            ...increase,
                            tax: objData.tax,
                        };
                    }
                    if (
                        objData.status === "refund" ||
                        objData.status === "refund"
                    ) {
                        increase = {
                            ...increase,
                            refund: objData.billedAmount * -1,
                        };
                    }
                    if (objData.payment === "Cash") {
                        increase = {
                            ...increase,
                            "detail.cash": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Dana") {
                        increase = {
                            ...increase,
                            "detail.dana": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Shopee Pay") {
                        increase = {
                            ...increase,
                            "detail.shopeePay": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "OVO") {
                        increase = {
                            ...increase,
                            "detail.ovo": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "QRIS") {
                        increase = {
                            ...increase,
                            "detail.qris": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "BRI"
                    ) {
                        increase = {
                            ...increase,
                            "detail.bri": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "BNI"
                    ) {
                        increase = {
                            ...increase,
                            "detail.bni": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "BCA"
                    ) {
                        increase = {
                            ...increase,
                            "detail.bca": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "MANDIRI"
                    ) {
                        increase = {
                            ...increase,
                            "detail.mandiri": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Bank Transfer") {
                        increase = {
                            ...increase,
                            "detail.bankTransfer": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Online Payment") {
                        increase = {
                            ...increase,
                            "detail.onlinePayment": objData.billedAmount,
                        };
                    }

                    await Balance.findOneAndUpdate(
                        { isOpen: true },
                        { $inc: increase },
                        { new: true, upsert: false },
                    );
                }
            }

            const data = new Order(objData);
            const newData = await data.save();

            return res.json(newData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editOrder = async (req, res) => {
    try {
        imageUpload.single("invoiceImg")(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Failed to upload image",
                });
            } else if (err) {
                return res.status(400).json({
                    status: "Failed",
                    message: err.message.message,
                });
            }

            let objData = req.body;

            let qMatch = { _id: req.params.id };
            if (req.userData) {
                qMatch.tenantRef = req.userData?.tenantRef;
                qMatch.outletRef = req.userData?.outletRef;
            }

            const exist = await Order.findOne(qMatch);

            if (!exist) {
                return res.status(400).json({ message: "Data not found." });
            }

            if (req.file) {
                // Chek image & delete image
                if (exist.invoiceImg.imageId) {
                    await cloudinary.uploader.destroy(exist.invoiceImg.imageId);
                }

                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                objData = Object.assign(objData, {
                    invoiceImg: {
                        image: cloud.secure_url,
                        imageId: cloud.public_id,
                    },
                });
            }

            if (req.body?.customerString) {
                objData.customer = JSON.parse(req.body.customerString);
            }

            if (req.body?.ordersString) {
                objData.orders = JSON.parse(req.body.ordersString);
            }

            let checkMember = null;

            if (objData?.customer?.address) {
                objData.isOnline = true;
            }

            if (objData?.customer?.phone) {
                objData.customer.phone = convertToE164(objData.customer.phone);
                let qMember = { phone: objData.customer.phone };
                if (req.userData) {
                    qMember.tenantRef = req.userData?.tenantRef;
                }

                checkMember = await Member.findOneAndUpdate(
                    qMember,
                    { $set: objData.customer },
                    { new: true, upsert: false },
                );

                if (checkMember) {
                    let qFirstOrder = {
                        "customer.memberId": checkMember.memberId,
                    };
                    if (req.userData) {
                        qFirstOrder.tenantRef = req.userData?.tenantRef;
                    }
                    objData.customer.memberId = checkMember.memberId;

                    const hasPreviousOrder = await Order.exists(qFirstOrder);
                    if (!hasPreviousOrder) {
                        objData.firstOrder = true; // pertama order
                    }
                }

                if (!checkMember && objData?.customer?.isNew) {
                    // jika member baru
                    const currYear = new Date().getFullYear();
                    const memId = `EM${currYear}${generateRandomId()}`;
                    objData.customer = {
                        ...objData.customer,
                        memberId: memId,
                        phone:
                            objData.customer.phone === "62" ||
                            objData.customer.phone === "0"
                                ? memId
                                : objData.customer.phone,
                        tenantRef: req?.userData?.tenantRef || null,
                    };
                    const custData = new Member(objData.customer);
                    checkMember = await custData.save();

                    objData.firstOrder = true; // pertama order
                }
            }

            if (objData.voucherCode) {
                if (!exist.voucherCode.includes(objData.voucherCode)) {
                    if (
                        typeof objData.voucherCode === "string" &&
                        objData.voucherCode.trim() !== ""
                    ) {
                        objData.voucherCode = [objData.voucherCode];
                    } else if (!Array.isArray(objData.voucherCode)) {
                        objData.voucherCode = [];
                    }
                }
            }

            // // Cek dan simpan penggunaan voucher jika ada
            // if (checkMember && Array.isArray(objData.voucherCode) && objData.voucherCode.length > 0) {
            //     await MemberVoucher.updateMany(
            //         { voucherCode: { $in: objData.voucherCode } },
            //         { $set: { isUsed: true, usedAt: new Date() } }
            //     );
            // }

            if (objData?.status && objData?.billedAmount) {
                const statusPay = ["paid", "refund"];
                // const settings = await Setting.findOne();
                // if (settings.cashBalance && statusPay.includes(objData.status)) {
                if (
                    objData?.status === "paid" &&
                    exist.status !== "paid" &&
                    !objData.paymentDate
                ) {
                    objData.paymentDate = new Date();
                }
                if (
                    statusPay.includes(objData.status) &&
                    !statusPay.includes(exist.status)
                ) {
                    let increase = {
                        sales: objData.billedAmount,
                    };

                    if (objData.serviceCharge) {
                        increase = {
                            ...increase,
                            serviceCharge: objData.serviceCharge,
                        };
                    }
                    if (objData.tax) {
                        increase = {
                            ...increase,
                            tax: objData.tax,
                        };
                    }
                    if (
                        objData.status === "refund" ||
                        objData.status === "refund"
                    ) {
                        increase = {
                            ...increase,
                            refund: objData.billedAmount * -1,
                        };
                    }
                    if (objData.payment === "Cash") {
                        increase = {
                            ...increase,
                            "detail.cash": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Dana") {
                        increase = {
                            ...increase,
                            "detail.dana": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Shopee Pay") {
                        increase = {
                            ...increase,
                            "detail.shopeePay": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "OVO") {
                        increase = {
                            ...increase,
                            "detail.ovo": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "QRIS") {
                        increase = {
                            ...increase,
                            "detail.qris": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "BRI"
                    ) {
                        increase = {
                            ...increase,
                            "detail.bri": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "BNI"
                    ) {
                        increase = {
                            ...increase,
                            "detail.bni": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "BCA"
                    ) {
                        increase = {
                            ...increase,
                            "detail.bca": objData.billedAmount,
                        };
                    }
                    if (
                        objData.payment === "Card" &&
                        objData.cardBankName === "MANDIRI"
                    ) {
                        increase = {
                            ...increase,
                            "detail.mandiri": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Bank Transfer") {
                        increase = {
                            ...increase,
                            "detail.bankTransfer": objData.billedAmount,
                        };
                    }
                    if (objData.payment === "Online Payment") {
                        increase = {
                            ...increase,
                            "detail.onlinePayment": objData.billedAmount,
                        };
                    }

                    await Balance.findOneAndUpdate(
                        { isOpen: true },
                        { $inc: increase },
                        { new: true, upsert: false },
                    );
                }
            }

            const updatedData = await Order.updateOne(
                { _id: req.params.id },
                {
                    $set: objData,
                },
            );
            return res.json(updatedData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const editOrderRaw = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const updatedData = await Order.updateOne(qMatch, {
            $set: req.body,
        });
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const editPrintCount = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const updatedData = await Order.updateOne(qMatch, {
            $inc: { printCount: 1 },
            $push: {
                printHistory: {
                    staff: req.body.staff,
                },
            },
        });
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const editPrintLaundry = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const updatedData = await Order.updateOne(qMatch, {
            $inc: { printLaundry: 1 },
            $push: {
                printHistory: {
                    staff: req.body.staff,
                    isLaundry: true,
                },
            },
        });
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteOrder = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        // Chek image & delete image
        const check = await Order.findOne(qMatch);
        if (check.invoiceImg.imageId) {
            await cloudinary.uploader.destroy(check.invoiceImg.imageId);
        }
        const deletedData = await Order.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
