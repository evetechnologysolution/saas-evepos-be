import mongoose from "mongoose";
import Order from "../../models/pos/order.js";
import Member from "../../models/member/member.js";
import MemberVoucher from "../../models/member/voucherMember.js";
import PointHistory from "../../models/point/pointHistory.js";
import Balance from "../../models/cashBalance/cashBalance.js";
import { generateRandomId } from "../../lib/generateRandom.js";
import { checkPoint, adjustPointHistories, createPointHistory } from "../../lib/handlePoint.js";
import { convertToE164 } from "../../lib/textSetting.js";
import { errorResponse } from "../../utils/errorResponse.js";
import { sendOrderMail } from "../../lib/nodemailer.js";
import { pusherNotif } from "../../lib/pusher.js";
import { mergeMasterStatus } from "../../lib/mergeStatus.js";

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
            sort,
        } = req.query;

        let qMatch = { status: { $ne: "backlog" } };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search) ? search : null;

            qMatch = {
                ...qMatch,
                $or: [
                    ...(fixedId ? [{ _id: fixedId }] : []),
                    { orderId: { $regex: search, $options: "i" } },
                    { "customer.memberId": { $regex: search, $options: "i" } },
                    { "customer.name": { $regex: search, $options: "i" } },
                    {
                        "customer.phone": {
                            $regex: isNaN(search) ? search : convertToE164(search),
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
                createdAt: {
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

        let sortObj = { createdAt: -1 }; // default
        if (sort && sort.trim() !== "") {
            sortObj = {};
            sort.split(",").forEach((rule) => {
                const [field, type] = rule.split(":");
                sortObj[field] = type === "asc" ? 1 : -1;
            });
        }

        const options = {
            populate: [
                {
                    path: "customerRef",
                    select: "memberId name firstName lastName phone notes point",
                },
                {
                    path: "progressRef",
                    select: "latestStatus latestNotes log",
                    populate: {
                        path: "log.staffRef",
                        select: "fullname",
                    },
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
            lean: true,
            leanWithId: false,
        };
        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getDeliveryOrder = async (req, res) => {
    try {
        const { page, perPage, search, printCount, printLaundry, status, progressStatus, pickup, start, end, paidStart, paidEnd, sort } =
            req.query;

        let qMatch = { orderType: "delivery" };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    ...(fixedId ? [{ _id: fixedId }] : []),
                    { orderId: { $regex: search, $options: "i" } },
                    { "customer.memberId": { $regex: search, $options: "i" } },
                    { "customer.name": { $regex: search, $options: "i" } },
                    {
                        "customer.phone": {
                            $regex: isNaN(search) ? search : convertToE164(search),
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
                createdAt: {
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
        };

        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getTrackOrder = async (req, res) => {
    try {
        const { page, perPage, search, status, progressStatus, pickup, start, end, paidStart, paidEnd, sort } = req.query;

        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search) ? search : null;

            qMatch = {
                ...qMatch,
                $or: [
                    ...(fixedId ? [{ _id: fixedId }] : []),
                    { orderId: { $regex: search, $options: "i" } },
                    { "customer.memberId": { $regex: search, $options: "i" } },
                    { "customer.name": { $regex: search, $options: "i" } },
                    {
                        "customer.phone": {
                            $regex: isNaN(search) ? search : convertToE164(search),
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
                createdAt: {
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
        };

        const listofData = await Order.paginate(qMatch, options);

        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getCountTrackOrder = async (req, res) => {
    try {
        const { start, end } = req.query;

        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const dStart = start ? new Date(start) : new Date();
        const dEnd = new Date(end ? end : dStart);

        dStart.setHours(0, 0, 0, 0);
        const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string
        dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
        const fixEnd = new Date(dEnd.toISOString());

        qMatch.createdAt = {
            $gte: fixStart,
            $lte: fixEnd,
        };

        const result = await Order.aggregate([
            {
                $match: qMatch,
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
        res.status(200).json(result?.length > 0 ? result[0] : { new: 0, old: 0 });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING ORDER BY MEMBER
export const getOrderByMember = async (req, res) => {
    try {
        const { page, perPage, search, status, progressStatus, pickup, orderType, sort } = req.query;

        let qMatch = {
            "customer.memberId": req.params.id,
            // status: { $ne: "backlog" }
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search) ? search : null;

            qMatch = {
                ...qMatch,
                $or: [...(fixedId ? [{ _id: fixedId }] : []), { orderId: { $regex: search, $options: "i" } }], // option i for case insensitivity to match upper and lower cases.
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
        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING PAID DATA
export const getPaidOrder = async (req, res) => {
    try {
        const { page, perPage, search, start, end, paidStart, paidEnd, sort } = req.query;

        let qMatch = {
            status: { $in: [/^paid$/i, /^refund$/i] },
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search) ? search : null;

            qMatch = {
                ...qMatch,
                $or: [
                    ...(fixedId ? [{ _id: fixedId }] : []),
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
                createdAt: {
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
        };

        const listofData = await Order.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING CLOSE CASHIER
export const getCloseCashierOrder = async (req, res) => {
    try {
        const { start, end } = req.query;
        let qMatch = {
            status: { $in: [/^paid$/i, /^refund$/i] },
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (start && end) {
            qMatch = {
                ...qMatch,
                paymentDate: {
                    $gte: start,
                    $lte: end,
                },
            };
        }
        const listofData = await Order.find(qMatch)
            .select([
                "createdAt",
                "paymentDate",
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
            .sort({ paymentDate: 1 });

        // Hitung total dokumen
        const totalDocuments = listofData.length;

        // Hitung jumlah billedAmount
        const totalBilledAmount = listofData.reduce((total, order) => total + order.billedAmount, 0);

        return res.json({
            docs: listofData,
            totalDocs: totalDocuments,
            totalBilledAmount: totalBilledAmount,
        });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING EXPORT ORDER
export const getExportOrder = async (req, res) => {
    try {
        const { search, start, end, paidStart, paidEnd, sort } = req.query;
        let qMatch = {
            status: { $in: [/^paid$/i, /^refund$/i] },
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        if (search) {
            const fixedId = mongoose.Types.ObjectId.isValid(search) ? search : null;

            qMatch = {
                ...qMatch,
                $or: [
                    ...(fixedId ? [{ _id: fixedId }] : []),
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
                createdAt: {
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

        let sortObj = { createdAt: -1 }; // default
        if (sort && sort.trim() !== "") {
            sortObj = {};
            sort.split(",").forEach((rule) => {
                const [field, type] = rule.split(":");
                sortObj[field] = type === "asc" ? 1 : -1;
            });
        }

        const listofData = await Order.find(qMatch).sort(sortObj);

        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING SAVED BILL
export const getSavedBill = async (req, res) => {
    try {
        let qMatch = { status: "unpaid" };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const listofData = await Order.find(qMatch).lean();
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING UNFINISHED ORDER
export const getUnfinishedOrder = async (req, res) => {
    try {
        let qMatch = {
            status: { $in: ["pending", "unpaid", "half paid"] },
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const exists = await Order.exists(qMatch);

        return res.json({
            exists: !!exists
        });

    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// GETTING A SPECIFIC DATA BY ID
export const getOrderById = async (req, res) => {
    try {
        let qMatch = {
            $or: [{ orderId: req.params.id }, ...(mongoose.Types.ObjectId.isValid(req.params.id) ? [{ _id: req.params.id }] : [])],
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Order.findOne(qMatch)
            .populate([
                {
                    path: "orders.masterProgressRef",
                    select: "masterStatus",
                    populate: {
                        path: "masterStatus",
                        select: "name",
                    },
                },
                {
                    path: "customerRef",
                    select: "memberId name firstName lastName phone notes point",
                },
                {
                    path: "progressRef",
                    select: "latestStatus latestNotes log",
                    populate: {
                        path: "log.staffRef",
                        select: "fullname",
                    },
                },
            ])
            .lean({ virtuals: true });

        if (!spesificData) {
            return res.status(404).json({ message: "Data not found" });
        }

        const mergedMasterStatus = mergeMasterStatus(spesificData.orders);

        spesificData.masterStatusSummary = mergedMasterStatus;

        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getOrderProgressById = async (req, res) => {
    try {
        let qMatch = {
            $or: [{ orderId: req.params.id }, ...(mongoose.Types.ObjectId.isValid(req.params.id) ? [{ _id: req.params.id }] : [])],
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }
        const spesificData = await Order.findOne(qMatch)
            .select("orderId date customer orders progressRef")
            .populate([
                {
                    path: "progressRef",
                    select: "latestStatus latestNotes log",
                    populate: {
                        path: "log.staffRef",
                        select: "fullname",
                    },
                },
            ])
            .lean({ virtuals: true });

        if (!spesificData) {
            return res.status(404).json({ message: "Data not found" });
        }

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
export const addOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let objData = req.body;

        const isDailyPromotion = objData?.orders?.some((field) => field?.isDailyPromotion === true);

        const selectedTenant = req.userData.tenantRef || null;

        if (req.userData) {
            objData.tenantRef = req.userData.tenantRef;
            if (req.userData?.outletRef) {
                objData.outletRef = req.userData.outletRef;
            }
        }

        if (req.body?.customerString) {
            objData.customer = JSON.parse(req.body.customerString);
        }

        if (req.body?.ordersString) {
            objData.orders = JSON.parse(req.body.ordersString);
        }

        if (objData?.customer?.address) {
            objData.isOnline = true;
        }

        let checkMember = null;

        // ================= MEMBER LOGIC =================
        if (objData?.customer?.phone) {
            const phoneE164 = convertToE164(objData.customer.phone);

            const qMember = {
                phone: phoneE164,
                ...(req.userData?.tenantRef && {
                    tenantRef: req.userData.tenantRef,
                }),
            };

            checkMember = await Member.findOneAndUpdate(
                qMember,
                { $set: { ...objData.customer, phone: phoneE164 } },
                { new: true, session },
            );

            if (checkMember) {
                objData.customer.memberId = checkMember.memberId;

                const hasPreviousOrder = await Order.exists(
                    {
                        "customer.memberId": checkMember.memberId,
                        ...(req.userData?.tenantRef && {
                            tenantRef: req.userData.tenantRef,
                        }),
                    },
                    { session },
                );

                if (!hasPreviousOrder) {
                    objData.firstOrder = true;
                }
            }

            if (!checkMember && objData.customer.isNew) {
                const currYear = new Date().getFullYear();
                const memberId = `EM${currYear}${generateRandomId()}`;

                const newCustomer = {
                    ...objData.customer,
                    memberId,
                    phone: phoneE164 === "62" || phoneE164 === "0" ? memberId : phoneE164,
                    tenantRef: req.userData?.tenantRef || null,
                };

                const newMember = new Member(newCustomer);
                checkMember = await newMember.save({ session });

                objData.customer = newCustomer;
                objData.firstOrder = true;
            }
        }

        if (objData.voucherCode) {
            if (typeof objData.voucherCode === "string" && objData.voucherCode.trim() !== "") {
                objData.voucherCode = [objData.voucherCode];
            } else if (!Array.isArray(objData.voucherCode)) {
                objData.voucherCode = [];
            }
        }

        // Cek dan simpan penggunaan voucher jika ada
        if (checkMember && Array.isArray(objData.voucherCode) && objData.voucherCode.length > 0) {
            await MemberVoucher.updateMany(
                { voucherCode: { $in: objData.voucherCode } },
                { $set: { isUsed: true, usedAt: new Date() } },
                { session },
            );
        }

        // ================= BALANCE =================
        if (objData?.status && objData?.billedAmount) {
            const statusPay = ["paid", "refund"];

            if (objData.status === "paid" && !objData.paymentDate) {
                objData.paymentDate = new Date();
            }

            if (statusPay.includes(objData.status)) {
                let increase = { sales: objData.billedAmount };

                if (objData.serviceCharge) increase.serviceCharge = objData.serviceCharge;
                if (objData.tax) increase.tax = objData.tax;
                if (objData.status === "refund") increase.refund = objData.billedAmount * -1;

                const paymentMap = {
                    Cash: "detail.cash",
                    Dana: "detail.dana",
                    "Shopee Pay": "detail.shopeePay",
                    OVO: "detail.ovo",
                    QRIS: "detail.qris",
                    "Bank Transfer": "detail.bankTransfer",
                    "Online Payment": "detail.onlinePayment",
                };

                const payOption = paymentMap[objData.payment];
                if (payOption) increase[payOption] = objData.billedAmount;

                if (objData.payment === "Card" && objData.cardBankName) {
                    increase[`detail.${objData.cardBankName.toLowerCase()}`] = objData.billedAmount;
                }

                const qBal = {
                    isOpen: true,
                    ...(req.userData?.tenantRef && {
                        tenantRef: req.userData.tenantRef,
                    }),
                    ...(req.userData?.outletRef && {
                        outletRef: req.userData.outletRef,
                    }),
                };

                await Balance.findOneAndUpdate(qBal, { $inc: increase }, { new: true, session });
            }
        }

        // ================= SAVE ORDER =================
        const order = new Order(objData);
        const newData = await order.save({ session });

        // generate point
        if (checkMember && !isDailyPromotion) {
            if (objData?.isOnline || objData?.isScan) {
                const isPaid = objData.status === "paid";

                if (isPaid) {
                    const spendMoneyIncrement = objData.billedAmount > 0 ? objData.billedAmount : 0;
                    const pointsIncrement = checkPoint(objData.billedAmount);

                    await Member.findOneAndUpdate(
                        { _id: checkMember._id },
                        {
                            $inc: {
                                spendMoney: spendMoneyIncrement,
                                point: pointsIncrement,
                            },
                        },
                        { new: true, session }, // Opsi new: true untuk mendapatkan dokumen yang diperbarui
                    );

                    // update member point
                    if (objData.usedPoint) {
                        await adjustPointHistories(checkMember._id, selectedTenant, objData.usedPoint, newData._id, "reduce", session);
                    }

                    // create point history
                    if (pointsIncrement > 0) {
                        await createPointHistory(checkMember._id, newData._id, selectedTenant, pointsIncrement, "in", session);
                    }
                }

                if (objData.usedPoint) {
                    if (!isPaid) {
                        await adjustPointHistories(checkMember._id, selectedTenant, objData.usedPoint, newData._id, "reserve");
                    }
                    await Member.findOneAndUpdate(
                        { _id: checkMember._id },
                        {
                            $inc: { point: -Number(objData.usedPoint) },
                        },
                        { session },
                    );
                    await createPointHistory(checkMember._id, newData._id, selectedTenant, objData.usedPoint, "out", session);
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        // ================= NOTIFICATION =================
        if (newData && req.userData?.isEvewash) {
            if (objData.orderType === "delivery" && objData.status === "backlog") {
                try {
                    const channel = "admin-notif";
                    const event = "order-new";
                    const newObj = newData.toObject();
                    const roles = ["owner", "super admin", "admin", "cashier"];
                    const message =
                        newObj?.customer?.name && newObj?.customer?.phone
                            ? `New Delivery Order from ${newObj.customer.name} (${newObj.customer.phone})!`
                            : "New Delivery Order!";
                    const notifPayload = { ...newObj, message, roles };

                    // kirim email + pusher parallel
                    await Promise.allSettled([sendOrderMail(newObj), pusherNotif(channel, event, notifPayload)]);
                } catch (err) {
                    console.error("Notification error:", err.message);
                }
            }
        }

        return res.json(newData);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// UPDATE A SPECIFIC DATA
export const editOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let objData = req.body;

        const isDailyPromotion = objData?.orders?.some((field) => field?.isDailyPromotion === true);

        const selectedTenant = req.userData.tenantRef || null;

        const qMatch = {
            _id: req.params.id,
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        const exist = await Order.findOne(qMatch).session(session);
        if (!exist) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Data not found." });
        }

        if (req.body?.customerString) {
            objData.customer = JSON.parse(req.body.customerString);
        }

        if (req.body?.ordersString) {
            objData.orders = JSON.parse(req.body.ordersString);
        }

        if (objData?.customer?.address) {
            objData.isOnline = true;
        }

        // ================= MEMBER =================
        let checkMember = null;

        if (objData?.customer?.phone) {
            const phoneE164 = convertToE164(objData.customer.phone);

            const qMember = {
                phone: phoneE164,
                ...(req.userData?.tenantRef && {
                    tenantRef: req.userData.tenantRef,
                }),
            };

            checkMember = await Member.findOneAndUpdate(
                qMember,
                { $set: { ...objData.customer, phone: phoneE164 } },
                { new: true, session },
            );

            if (checkMember) {
                objData.customer.memberId = checkMember.memberId;

                const hasPreviousOrder = await Order.exists(
                    {
                        "customer.memberId": checkMember.memberId,
                        ...(req.userData?.tenantRef && {
                            tenantRef: req.userData.tenantRef,
                        }),
                    },
                    { session },
                );

                if (!hasPreviousOrder) {
                    objData.firstOrder = true;
                }
            }

            if (!checkMember && objData.customer.isNew) {
                const currYear = new Date().getFullYear();
                const memberId = `EM${currYear}${generateRandomId()}`;

                const newCustomer = {
                    ...objData.customer,
                    memberId,
                    phone: phoneE164 === "62" || phoneE164 === "0" ? memberId : phoneE164,
                    tenantRef: req.userData?.tenantRef || null,
                };

                const newMember = new Member(newCustomer);
                checkMember = await newMember.save({ session });

                objData.customer = newCustomer;
                objData.firstOrder = true;
            }
        }

        // ================= VOUCHER =================
        if (objData.voucherCode) {
            if (!exist.voucherCode.includes(objData.voucherCode)) {
                if (typeof objData.voucherCode === "string" && objData.voucherCode.trim()) {
                    objData.voucherCode = [objData.voucherCode];
                } else if (!Array.isArray(objData.voucherCode)) {
                    objData.voucherCode = [];
                }
            }
        }

        // Cek dan simpan penggunaan voucher jika ada
        if (checkMember && Array.isArray(objData.voucherCode) && objData.voucherCode.length > 0) {
            await MemberVoucher.updateMany(
                { voucherCode: { $in: objData.voucherCode } },
                { $set: { isUsed: true, usedAt: new Date() } },
                { session },
            );
        }

        // ================= BALANCE =================
        if (objData?.status && objData?.billedAmount) {
            const statusPay = ["paid", "refund"];

            if (objData.status === "paid" && exist.status !== "paid" && !objData.paymentDate) {
                objData.paymentDate = new Date();
            }

            if (statusPay.includes(objData.status) && !statusPay.includes(exist.status)) {
                let increase = { sales: objData.billedAmount };

                if (objData.serviceCharge) increase.serviceCharge = objData.serviceCharge;
                if (objData.tax) increase.tax = objData.tax;
                if (objData.status === "refund") increase.refund = objData.billedAmount * -1;

                const paymentMap = {
                    Cash: "detail.cash",
                    Dana: "detail.dana",
                    "Shopee Pay": "detail.shopeePay",
                    OVO: "detail.ovo",
                    QRIS: "detail.qris",
                    "Bank Transfer": "detail.bankTransfer",
                    "Online Payment": "detail.onlinePayment",
                };

                const payOption = paymentMap[objData.payment];
                if (payOption) increase[payOption] = objData.billedAmount;

                if (objData.payment === "Card" && objData.cardBankName) {
                    increase[`detail.${objData.cardBankName.toLowerCase()}`] = objData.billedAmount;
                }

                const qBal = {
                    isOpen: true,
                    ...(req.userData?.tenantRef && {
                        tenantRef: req.userData.tenantRef,
                    }),
                    ...(req.userData?.outletRef && {
                        outletRef: req.userData.outletRef,
                    }),
                };

                await Balance.findOneAndUpdate(qBal, { $inc: increase }, { new: true, session });
            }
        }

        // ================= UPDATE ORDER =================
        const updatedData = await Order.updateOne({ _id: req.params.id }, { $set: objData }, { session });

        // generate point
        if (checkMember && !isDailyPromotion) {
            if (objData?.isOnline || objData?.isScan) {
                const isPaid = objData.status === "paid";

                if (isPaid) {
                    const spendMoneyIncrement = objData.billedAmount > 0 ? objData.billedAmount : 0;
                    const pointsIncrement = checkPoint(objData.billedAmount);

                    await Member.findOneAndUpdate(
                        { _id: checkMember._id },
                        {
                            $inc: {
                                spendMoney: spendMoneyIncrement,
                                point: pointsIncrement,
                            },
                        },
                        { new: true, session }, // Opsi new: true untuk mendapatkan dokumen yang diperbarui
                    );

                    // update member point
                    if (objData.usedPoint) {
                        await adjustPointHistories(checkMember._id, selectedTenant, objData.usedPoint, exist._id, "reduce", session);
                    }

                    // create point history
                    if (pointsIncrement > 0) {
                        await createPointHistory(checkMember._id, exist._id, selectedTenant, pointsIncrement, "in", session);
                    }
                }

                if (objData.usedPoint) {
                    if (!isPaid) {
                        await adjustPointHistories(checkMember._id, selectedTenant, objData.usedPoint, exist._id, "reserve");
                    }
                    await Member.findOneAndUpdate(
                        { _id: checkMember._id },
                        {
                            $inc: { point: -Number(objData.usedPoint) },
                        },
                        { session },
                    );
                    await createPointHistory(checkMember._id, exist._id, selectedTenant, objData.usedPoint, "out", session);
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        return res.json(updatedData);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const generatePoint = async (req, res) => {
    try {
        let qMatch = { $or: [{ _id: req.params.id }, { orderId: req.params.id }] };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            // qMatch.outletRef = req.userData?.outletRef;
        }

        const check = await Order.findOne(qMatch);
        if (!check) {
            return res.status(404).json({ message: "Data not found" });
        }
        if (check?.isScan || check?.status !== "paid") {
            return res.status(400).json({ message: "Failed generate point." });
        }

        const checkMember = await Member.findOne({ phone: check.customer.phone });
        if (!checkMember) {
            return res.status(404).json({ message: "Member not found" });
        }

        const pointsIncrement = checkPoint(check.billedAmount);

        await Order.updateOne({ _id: check._id }, { $set: { isScan: true } });

        const updatedMember = await Member.findOneAndUpdate(
            { _id: checkMember._id },
            { $inc: { point: pointsIncrement } },
            { new: true }, // Opsi new: true untuk mendapatkan dokumen yang diperbarui
        );

        // create point history
        if (pointsIncrement > 0) {
            const expiryDate = check?.paymentDate ? new Date(check?.paymentDate) : new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Add 1 year
            expiryDate.setHours(0, 0, 0, 0);

            const objHistory = {
                memberRef: checkMember._id,
                orderRef: check._id,
                tenantRef: req.userData?.tenantRef,
                point: pointsIncrement,
                pointRemaining: pointsIncrement,
                createdAt: check?.paymentDate || new Date(),
                pointExpiry: expiryDate,
                status: "in",
            };

            await PointHistory.create(objHistory);
        }

        return res.json(updatedMember);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const editOrderRaw = async (req, res) => {
    try {
        const { id } = req.params;

        let qMatch = {};

        // kalau valid ObjectId → anggap sebagai _id
        if (mongoose.Types.ObjectId.isValid(id)) {
            qMatch._id = id;
        } else {
            // kalau bukan → anggap sebagai orderId
            qMatch.orderId = id;
        }

        // multi-tenant protection
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const updatedData = await Order.updateOne(qMatch, {
            $set: req.body,
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
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
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
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
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
        const deletedData = await Order.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
