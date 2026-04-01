import mongoose from "mongoose";
import Balance from "../../models/cashBalance/cashBalance.js";
import BalanceHistory from "../../models/cashBalance/cashBalanceHistory.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllBalance = async (req, res) => {
    try {
        const { page, perPage, start, end, sort } = req.query;

        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        if (start && end) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999);

            qMatch.startDate = {
                $gte: new Date(dStart.toISOString()),
                $lte: new Date(dEnd.toISOString()),
            };
        }

        let sortObj = { createdAt: -1 };
        if (sort && sort.trim() !== "") {
            sortObj = {};
            sort.split(",").forEach((rule) => {
                const [field, type] = rule.split(":");
                sortObj[field] = type === "asc" ? 1 : -1;
            });
        }

        const aggregate = Balance.aggregate([
            { $match: qMatch },

            // =========================
            // SUMMARY
            // =========================
            {
                $lookup: {
                    from: "cashbalancehistories",
                    let: { cashId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$cashBalanceRef", "$$cashId"] },
                            },
                        },
                        {
                            $lookup: {
                                from: "orders",
                                localField: "orderRef",
                                foreignField: "_id",
                                as: "order",
                            },
                        },
                        {
                            $unwind: {
                                path: "$order",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $group: {
                                _id: "$cashBalanceRef",

                                cashIn: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isCashOut", false] }, "$amount", 0],
                                    },
                                },
                                cashOut: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isCashOut", true] }, "$amount", 0],
                                    },
                                },

                                sales: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$title", "Sales"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                refund: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", true] },
                                                    { $eq: ["$title", "Refund"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },

                                orders: {
                                    $addToSet: {
                                        id: "$order._id",
                                        tax: { $ifNull: ["$order.tax", 0] },
                                        serviceCharge: {
                                            $ifNull: ["$order.serviceCharge", 0],
                                        },
                                    },
                                },

                                // PAYMENT
                                cash: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "cash"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bca: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bca"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bni: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bni"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bri: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bri"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                mandiri: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "mandiri"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                dana: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "dana"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                ovo: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "ovo"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                qris: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "qris"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                shopeePay: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "shopee pay"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bankTransfer: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bank transfer"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                onlinePayment: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "online payment"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                            },
                        },
                        {
                            $addFields: {
                                tax: {
                                    $reduce: {
                                        input: "$orders",
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.tax"] },
                                    },
                                },
                                serviceCharge: {
                                    $reduce: {
                                        input: "$orders",
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.serviceCharge"] },
                                    },
                                },
                            },
                        },
                    ],
                    as: "summary",
                },
            },

            // =========================
            // HISTORY
            // =========================
            {
                $lookup: {
                    from: "cashbalancehistories",
                    let: { cashId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$cashBalanceRef", "$$cashId"] },
                            },
                        },

                        // JOIN ORDER
                        {
                            $lookup: {
                                from: "orders",
                                localField: "orderRef",
                                foreignField: "_id",
                                as: "order",
                            },
                        },
                        {
                            $unwind: {
                                path: "$order",
                                preserveNullAndEmptyArrays: true,
                            },
                        },

                        // FORMAT orderRef
                        {
                            $addFields: {
                                orderRef: {
                                    $cond: [
                                        { $ifNull: ["$order._id", false] },
                                        {
                                            _id: "$order._id",
                                            orderId: "$order.orderId",
                                        },
                                        null,
                                    ],
                                },
                            },
                        },

                        {
                            $project: {
                                order: 0, // buang raw order
                            },
                        },

                        {
                            $sort: { createdAt: -1 },
                        },
                    ],
                    as: "history",
                },
            },

            // =========================
            // FINAL SHAPE
            // =========================
            {
                $addFields: {
                    cashIn: { $ifNull: [{ $arrayElemAt: ["$summary.cashIn", 0] }, 0] },
                    cashOut: { $ifNull: [{ $arrayElemAt: ["$summary.cashOut", 0] }, 0] },
                    sales: { $ifNull: [{ $arrayElemAt: ["$summary.sales", 0] }, 0] },
                    refund: { $ifNull: [{ $arrayElemAt: ["$summary.refund", 0] }, 0] },
                    tax: { $ifNull: [{ $arrayElemAt: ["$summary.tax", 0] }, 0] },
                    serviceCharge: { $ifNull: [{ $arrayElemAt: ["$summary.serviceCharge", 0] }, 0] },

                    detail: {
                        cash: { $ifNull: [{ $arrayElemAt: ["$summary.cash", 0] }, 0] },
                        bca: { $ifNull: [{ $arrayElemAt: ["$summary.bca", 0] }, 0] },
                        bni: { $ifNull: [{ $arrayElemAt: ["$summary.bni", 0] }, 0] },
                        bri: { $ifNull: [{ $arrayElemAt: ["$summary.bri", 0] }, 0] },
                        mandiri: { $ifNull: [{ $arrayElemAt: ["$summary.mandiri", 0] }, 0] },
                        dana: { $ifNull: [{ $arrayElemAt: ["$summary.dana", 0] }, 0] },
                        ovo: { $ifNull: [{ $arrayElemAt: ["$summary.ovo", 0] }, 0] },
                        qris: { $ifNull: [{ $arrayElemAt: ["$summary.qris", 0] }, 0] },
                        shopeePay: { $ifNull: [{ $arrayElemAt: ["$summary.shopeePay", 0] }, 0] },
                        bankTransfer: { $ifNull: [{ $arrayElemAt: ["$summary.bankTransfer", 0] }, 0] },
                        onlinePayment: { $ifNull: [{ $arrayElemAt: ["$summary.onlinePayment", 0] }, 0] },
                    },
                },
            },

            {
                $addFields: {
                    total: {
                        $subtract: ["$cashIn", "$cashOut"],
                    },
                },
            },

            {
                $project: {
                    summary: 0,
                },
            },

            {
                $sort: sortObj,
            },
        ]);

        const result = await Balance.aggregatePaginate(aggregate, {
            page: parseInt(page) || 1,
            limit: parseInt(perPage) || 10,
        });

        return res.json(result);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getCashFlow = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { tenantRef, outletRef } = req.userData || {};

        // FORMAT DATE
        const dStart = new Date(start);
        dStart.setHours(0, 0, 0, 0);

        const dEnd = new Date(end || start);
        dEnd.setHours(23, 59, 59, 999);

        const qMatch = {
            isOpen: { $ne: true },
            startDate: {
                $gte: dStart,
                $lte: dEnd,
            },
            ...(tenantRef && { tenantRef }),
            ...(outletRef && { outletRef }),
        };

        const result = await Balance.aggregate([
            {
                $match: qMatch,
            },

            {
                $lookup: {
                    from: "cashbalancehistories",
                    let: { cashId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$cashBalanceRef", "$$cashId"] },
                            },
                        },

                        {
                            $lookup: {
                                from: "orders",
                                localField: "orderRef",
                                foreignField: "_id",
                                as: "order",
                            },
                        },
                        {
                            $unwind: {
                                path: "$order",
                                preserveNullAndEmptyArrays: true,
                            },
                        },

                        {
                            $group: {
                                _id: null,

                                cashIn: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isCashOut", false] }, "$amount", 0],
                                    },
                                },
                                cashOut: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isCashOut", true] }, "$amount", 0],
                                    },
                                },

                                sales: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$title", "Sales"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },

                                refund: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", true] },
                                                    { $eq: ["$title", "Refund"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },

                                orders: {
                                    $addToSet: {
                                        id: "$order._id",
                                        tax: { $ifNull: ["$order.tax", 0] },
                                        serviceCharge: {
                                            $ifNull: ["$order.serviceCharge", 0],
                                        },
                                    },
                                },
                            },
                        },

                        {
                            $addFields: {
                                tax: {
                                    $reduce: {
                                        input: "$orders",
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.tax"] },
                                    },
                                },
                                serviceCharge: {
                                    $reduce: {
                                        input: "$orders",
                                        initialValue: 0,
                                        in: {
                                            $add: ["$$value", "$$this.serviceCharge"],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                    as: "summary",
                },
            },

            {
                $addFields: {
                    cashIn: { $ifNull: [{ $arrayElemAt: ["$summary.cashIn", 0] }, 0] },
                    cashOut: { $ifNull: [{ $arrayElemAt: ["$summary.cashOut", 0] }, 0] },
                    sales: { $ifNull: [{ $arrayElemAt: ["$summary.sales", 0] }, 0] },
                    refund: { $ifNull: [{ $arrayElemAt: ["$summary.refund", 0] }, 0] },
                    tax: { $ifNull: [{ $arrayElemAt: ["$summary.tax", 0] }, 0] },
                    serviceCharge: { $ifNull: [{ $arrayElemAt: ["$summary.serviceCharge", 0] }, 0] },
                },
            },

            // FINAL GROUP (gabung semua balance)
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$sales" },
                    cashIn: { $sum: "$cashIn" },
                    cashOut: { $sum: "$cashOut" },
                    refund: { $sum: "$refund" },
                    serviceCharge: { $sum: "$serviceCharge" },
                    tax: { $sum: "$tax" },
                },
            },

            {
                $project: {
                    _id: 0,
                    sales: 1,
                    cashIn: 1,
                    cashOut: 1,
                    refund: 1,
                    serviceCharge: 1,
                    tax: 1,
                },
            },
        ]);

        const data = {
            start,
            end: end || start,
            sales: result?.[0]?.sales || 0,
            cashIn: result?.[0]?.cashIn || 0,
            cashOut: result?.[0]?.cashOut || 0,
            refund: result?.[0]?.refund || 0,
            serviceCharge: result?.[0]?.serviceCharge || 0,
            tax: result?.[0]?.tax || 0,
        };

        return res.json(data);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getExistBalance = async (req, res) => {
    try {
        const { tenantRef, outletRef } = req.userData || {};

        const qMatch = {
            isOpen: true,
            ...(tenantRef && { tenantRef }),
            ...(outletRef && { outletRef }),
        };

        const result = await Balance.aggregate([
            {
                $match: qMatch,
            },

            {
                $lookup: {
                    from: "cashbalancehistories",
                    let: { cashId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$cashBalanceRef", "$$cashId"] },
                            },
                        },

                        // JOIN ORDER
                        {
                            $lookup: {
                                from: "orders",
                                localField: "orderRef",
                                foreignField: "_id",
                                as: "order",
                            },
                        },
                        {
                            $unwind: {
                                path: "$order",
                                preserveNullAndEmptyArrays: true,
                            },
                        },

                        {
                            $group: {
                                _id: "$cashBalanceRef",

                                // MAIN
                                cashIn: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isCashOut", false] }, "$amount", 0],
                                    },
                                },
                                cashOut: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isCashOut", true] }, "$amount", 0],
                                    },
                                },

                                sales: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$title", "Sales"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                refund: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", true] },
                                                    { $eq: ["$title", "Refund"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },

                                // ANTI DOUBLE TAX (collect unique order)
                                orders: {
                                    $addToSet: {
                                        id: "$order._id",
                                        tax: { $ifNull: ["$order.tax", 0] },
                                        serviceCharge: {
                                            $ifNull: ["$order.serviceCharge", 0],
                                        },
                                    },
                                },

                                // PAYMENT DETAIL
                                cash: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "cash"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bca: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bca"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bni: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bni"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bri: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bri"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                mandiri: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "mandiri"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                dana: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "dana"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                ovo: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "ovo"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                qris: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "qris"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                shopeePay: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "shopee pay"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                bankTransfer: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "bank transfer"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                                onlinePayment: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$isCashOut", false] },
                                                    { $eq: ["$payment", "online payment"] },
                                                ],
                                            },
                                            "$amount",
                                            0,
                                        ],
                                    },
                                },
                            },
                        },

                        // HITUNG TAX & SERVICE CHARGE DARI UNIQUE ORDERS
                        {
                            $addFields: {
                                tax: {
                                    $reduce: {
                                        input: "$orders",
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.tax"] },
                                    },
                                },
                                serviceCharge: {
                                    $reduce: {
                                        input: "$orders",
                                        initialValue: 0,
                                        in: {
                                            $add: ["$$value", "$$this.serviceCharge"],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                    as: "summary",
                },
            },

            {
                $addFields: {
                    cashIn: { $ifNull: [{ $arrayElemAt: ["$summary.cashIn", 0] }, 0] },
                    cashOut: { $ifNull: [{ $arrayElemAt: ["$summary.cashOut", 0] }, 0] },
                    sales: { $ifNull: [{ $arrayElemAt: ["$summary.sales", 0] }, 0] },
                    refund: { $ifNull: [{ $arrayElemAt: ["$summary.refund", 0] }, 0] },
                    tax: { $ifNull: [{ $arrayElemAt: ["$summary.tax", 0] }, 0] },
                    serviceCharge: { $ifNull: [{ $arrayElemAt: ["$summary.serviceCharge", 0] }, 0] },

                    detail: {
                        cash: { $ifNull: [{ $arrayElemAt: ["$summary.cash", 0] }, 0] },
                        bca: { $ifNull: [{ $arrayElemAt: ["$summary.bca", 0] }, 0] },
                        bni: { $ifNull: [{ $arrayElemAt: ["$summary.bni", 0] }, 0] },
                        bri: { $ifNull: [{ $arrayElemAt: ["$summary.bri", 0] }, 0] },
                        mandiri: { $ifNull: [{ $arrayElemAt: ["$summary.mandiri", 0] }, 0] },
                        dana: { $ifNull: [{ $arrayElemAt: ["$summary.dana", 0] }, 0] },
                        ovo: { $ifNull: [{ $arrayElemAt: ["$summary.ovo", 0] }, 0] },
                        qris: { $ifNull: [{ $arrayElemAt: ["$summary.qris", 0] }, 0] },
                        shopeePay: { $ifNull: [{ $arrayElemAt: ["$summary.shopeePay", 0] }, 0] },
                        bankTransfer: { $ifNull: [{ $arrayElemAt: ["$summary.bankTransfer", 0] }, 0] },
                        onlinePayment: { $ifNull: [{ $arrayElemAt: ["$summary.onlinePayment", 0] }, 0] },
                    },
                },
            },

            {
                $addFields: {
                    total: {
                        $subtract: ["$cashIn", "$cashOut"],
                    },
                },
            },

            {
                $project: {
                    summary: 0,
                },
            },

            {
                $sort: { createdAt: -1 },
            },
        ]);

        return res.status(200).json(result[0]);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const closeBalance = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        let qMatch = { isOpen: true };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const existing = await Balance.findOne(qMatch).session(session);

        if (!existing) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
                message: "Tidak ada balance yang sedang terbuka",
            });
        }

        // update
        existing.endDate = new Date();
        existing.isOpen = false;
        existing.notes = req?.body?.notes || "";
        existing.difference = req?.body?.difference || 0;

        await existing.save({ session });

        // history
        if (req.body.cashOut && req.body.cashOut > 0) {
            await BalanceHistory.create(
                [
                    {
                        title: "Tutup Kas",
                        isCashOut: true,
                        amount: req.body.cashOut,
                        cashBalanceRef: existing._id,
                        ...(req.userData && {
                            tenantRef: req.userData?.tenantRef,
                            outletRef: req.userData?.outletRef,
                        }),
                    },
                ],
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return res.json(existing);
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

export const getBalanceById = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const spesificData = await Balance.findOne(qMatch).lean({ virtuals: true });
        return res.json(spesificData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// UPDATE A SPECIFIC DATA
export const editBalance = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const updatedData = await Balance.updateOne(qMatch, {
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

// DELETE A SPECIFIC DATA
export const deleteBalance = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const deletedData = await Balance.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
