import mongoose from "mongoose";
import Order from "../../../models/pos/order.js";
import Member from "../../../models/member/member.js";
import MemberVoucher from "../../../models/member/voucherMember.js";
import PointHistory from "../../../models/point/pointHistory.js";
import Balance from "../../../models/cashBalance/cashBalance.js";
import BalanceHistory from "../../../models/cashBalance/cashBalanceHistory.js";
import { generateRandomId } from "../../../lib/generateRandom.js";
import { checkPoint, adjustPointHistories, createPointHistory } from "../../../lib/handlePoint.js";
import { convertToE164 } from "../../../lib/textSetting.js";
import { errorResponse } from "../../../utils/errorResponse.js";
import { sendOrderMail } from "../../../lib/nodemailer.js";
import { pusherNotif } from "../../../lib/pusher.js";
import { mergeMasterStatus } from "../../../lib/mergeStatus.js";
import { processOrderAsync } from "../../../lib/processOrder.js";

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
            isTransfer,
            showAllTransfer,
            transferStatus,
            progressStatus,
            paymentMethod,
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
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;
            if (outletRef != null) {
                const transferValue = String(isTransfer || "").toLowerCase();
                if (["yes", "1", "true"].includes(transferValue)) {
                    if (outletRef != null) {
                        const outletObjectId = new mongoose.Types.ObjectId(String(outletRef));
                        if (["yes", "1", "true"].includes(showAllTransfer)) {
                            qMatch.$and = [
                                {
                                    $or: [
                                        { outletRef: outletObjectId },
                                        { "transfer.toOutletRef": outletObjectId },
                                    ],
                                },
                                { "transfer.toOutletRef": { $ne: null } }
                            ];
                        } else {
                            qMatch["transfer.toOutletRef"] = outletObjectId;
                        }
                    } else {
                        qMatch["transfer.toOutletRef"] = { $ne: null };
                    }
                } else if (["no", "0", "false"].includes(transferValue)) {
                    qMatch["transfer.toOutletRef"] = null;
                    qMatch.outletRef = new mongoose.Types.ObjectId(String(outletRef));
                } else {
                    qMatch.outletRef = new mongoose.Types.ObjectId(String(outletRef));
                }
            }
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

        if (transferStatus) {
            const fixStatus = transferStatus.replace(":ne", "").trim();
            if (fixStatus) {
                const fixStatusArray = fixStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih

                if (transferStatus.includes(":ne")) {
                    qMatch.transfer.status = { $nin: fixStatusArray };
                } else {
                    qMatch.transfer.status = { $in: fixStatusArray };
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
        if (paymentMethod) {
            const fixMethodArray = paymentMethod
                .replace(":ne", "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

            const regexArray = fixMethodArray.map(
                (item) => new RegExp(`^${item}$`, "i")
            );

            if (paymentMethod.includes(":ne")) {
                qMatch.payment = { $nin: regexArray };
            } else {
                qMatch.payment = { $in: regexArray };
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
                { path: "outletRef", select: "name isPrimary" },
                { path: "transfer.toOutletRef", select: "name" }
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
            lean: true,
            leanWithId: false,
        };
        // const listofData = await Order.paginate(qMatch, options);
        // return res.json(listofData);

        const [summaryResult, paymentResult, listofData] = await Promise.all([
            Order.aggregate([
                { $match: qMatch },
                {
                    $group: {
                        _id: null,
                        roundingAmount: {
                            $sum: { $ifNull: ["$roundingAmount", 0] }
                        },
                        revenue: {
                            $sum: { $ifNull: ["$billedAmount", 0] }
                        },
                        sales: {
                            $sum: {
                                $cond: [
                                    { $gt: ["$billedAmount", 0] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),
            Order.aggregate([
                { $match: qMatch },
                {
                    $group: {
                        _id: {
                            payment: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$payment", "Cash"] }, then: "Cash" },
                                        { case: { $eq: ["$payment", "Card"] }, then: "Card" },
                                        { case: { $eq: ["$payment", "Bank Transfer"] }, then: "Bank Transfer" },
                                        { case: { $eq: ["$payment", "Online Payment"] }, then: "Online Payment" },
                                        { case: { $eq: ["$payment", "QRIS"] }, then: "QRIS" },
                                    ],
                                    default: "E-Wallet",
                                },
                            },
                        },
                        revenue: {
                            $sum: {
                                $ifNull: ["$billedAmount", 0]
                            }
                        },
                        sales: {
                            $sum: {
                                $cond: [
                                    { $gt: ["$billedAmount", 0] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        payment: "$_id.payment",
                        revenue: 1,
                        sales: 1,
                    }
                },
                {
                    $sort: {
                        revenue: -1,
                    }
                }
            ]),
            Order.paginate(qMatch, options)
        ]);

        const summary = summaryResult?.[0] || {
            roundingAmount: 0,
            revenue: 0,
            sales: 0,
        };

        const paymentSummaryFormatted = {
            cash: {
                revenue: 0,
                sales: 0,
            },
            nonCash: {
                revenue: 0,
                sales: 0,
            },
            detail: paymentResult,
        };

        paymentResult.forEach((item) => {
            const revenue = Number(item.revenue || 0);
            const sales = Number(item.sales || 0);

            if ((item.payment || "").toLowerCase() === "cash") {
                paymentSummaryFormatted.cash.revenue += revenue;
                paymentSummaryFormatted.cash.sales += sales;
            } else {
                paymentSummaryFormatted.nonCash.revenue += revenue;
                paymentSummaryFormatted.nonCash.sales += sales;
            }
        });

        return res.json({
            ...listofData,
            summary,
            paymentSummary: paymentSummaryFormatted,
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
        const { search, status, paymentMethod, start, end, paidStart, paidEnd, sort } = req.query;
        let qMatch = {
            // status: { $in: [/^paid$/i, /^refund$/i] },
            status: { $nin: "backlog" }
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            const outletRef =
                req.body?.outletRef ??
                req.query?.outletRef ??
                req.userData?.outletRef;

            if (outletRef != null) {
                qMatch.outletRef = new mongoose.Types.ObjectId(String(outletRef));
            }
        }
        if (status) {
            const fixStatus = status.replace(":ne", "").trim();
            if (fixStatus) {
                let fixStatusArray = fixStatus
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean); // Pastikan array dan bersih

                // tambahkan "refund" jika ada "paid"
                if (fixStatusArray.includes("paid")) {
                    fixStatusArray = [...new Set([...fixStatusArray, "refund"])];
                }

                if (status.includes(":ne")) {
                    qMatch.status = { $nin: [...fixStatusArray, "backlog"] };
                } else {
                    qMatch.status = { $in: fixStatusArray };
                }
            }
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
        if (paymentMethod) {
            const fixMethodArray = paymentMethod
                .replace(":ne", "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

            const regexArray = fixMethodArray.map(
                (item) => new RegExp(`^${item}$`, "i")
            );

            if (paymentMethod.includes(":ne")) {
                qMatch.payment = { $nin: regexArray };
            } else {
                qMatch.payment = { $in: regexArray };
            }
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

        // const listofData = await Order.find(qMatch).sort(sortObj);
        // return res.json(listofData);

        const [summaryResult, paymentResult, listofData] = await Promise.all([
            Order.aggregate([
                { $match: qMatch },
                {
                    $group: {
                        _id: null,
                        roundingAmount: {
                            $sum: { $ifNull: ["$roundingAmount", 0] }
                        },
                        revenue: {
                            $sum: { $ifNull: ["$billedAmount", 0] }
                        },
                        sales: {
                            $sum: {
                                $cond: [
                                    { $gt: ["$billedAmount", 0] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),
            Order.aggregate([
                { $match: qMatch },
                {
                    $group: {
                        _id: {
                            payment: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$payment", "Cash"] }, then: "Cash" },
                                        { case: { $eq: ["$payment", "Card"] }, then: "Card" },
                                        { case: { $eq: ["$payment", "Bank Transfer"] }, then: "Bank Transfer" },
                                        { case: { $eq: ["$payment", "Online Payment"] }, then: "Online Payment" },
                                        { case: { $eq: ["$payment", "QRIS"] }, then: "QRIS" },
                                    ],
                                    default: "E-Wallet",
                                },
                            },
                        },
                        revenue: {
                            $sum: {
                                $ifNull: ["$billedAmount", 0]
                            }
                        },
                        sales: {
                            $sum: {
                                $cond: [
                                    { $gt: ["$billedAmount", 0] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        payment: "$_id.payment",
                        revenue: 1,
                        sales: 1,
                    }
                },
                {
                    $sort: {
                        revenue: -1,
                    }
                }
            ]),
            Order.find(qMatch).sort(sortObj)
        ]);

        const summary = summaryResult?.[0] || {
            roundingAmount: 0,
            revenue: 0,
            sales: 0,
        };

        const paymentSummaryFormatted = {
            cash: {
                revenue: 0,
                sales: 0,
            },
            nonCash: {
                revenue: 0,
                sales: 0,
            },
            detail: paymentResult,
        };

        paymentResult.forEach((item) => {
            const revenue = Number(item.revenue || 0);
            const sales = Number(item.sales || 0);

            if ((item.payment || "").toLowerCase() === "cash") {
                paymentSummaryFormatted.cash.revenue += revenue;
                paymentSummaryFormatted.cash.sales += sales;
            } else {
                paymentSummaryFormatted.nonCash.revenue += revenue;
                paymentSummaryFormatted.nonCash.sales += sales;
            }
        });

        return res.json({
            docs: listofData,
            summary,
            paymentSummary: paymentSummaryFormatted,
        });


    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
