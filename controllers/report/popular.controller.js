import Order from "../../models/pos/order.js";
import { getFirstAndLastDayOfWeek } from "../../lib/dateFormatter.js";
import { errorResponse } from "../../utils/errorResponse.js";

export const getPopularProduct = async (req, res) => {
    try {
        const { filter = "today", start: qStart, end: qEnd, limit } = req.query;

        let start;
        let end;
        let label = "";
        let qLimit = limit ? Number(limit) : 10;

        const now = new Date();

        switch (filter) {
            case "today": {
                label = "Today";
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            }

            case "thisWeek": {
                label = "This Week";
                const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
                start = firstDay;
                end = new Date(lastDay);
                end.setDate(end.getDate() + 1);
                break;
            }

            case "thisMonth": {
                label = "This Month";
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            }

            case "thisYear": {
                label = "This Year";
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);
                break;
            }

            case "date": {
                label = "Date Range";

                if (!qStart) {
                    return errorResponse(res, {
                        statusCode: 400,
                        code: "BAD_REQUEST",
                        message: "start date is required",
                    });
                }

                const dStart = new Date(qStart);
                dStart.setHours(0, 0, 0, 0);
                start = new Date(dStart.toISOString());

                const dEnd = new Date(qEnd || qStart);
                dEnd.setHours(23, 59, 59, 999);
                end = new Date(dEnd.toISOString());
                break;
            }

            default:
                return errorResponse(res, {
                    statusCode: 400,
                    code: "INVALID_FILTER",
                    message: "Invalid filter",
                });
        }

        const qMatch = {
            status: "paid",
            createdAt: { $gte: start, $lt: end },
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const result = await Order.aggregate([
            { $unwind: "$orders" },
            {
                $match: qMatch,
            },
            {
                $group: {
                    _id: "$orders.name",
                    sales: { $sum: "$orders.qty" },
                },
            },
            { $sort: { sales: -1, _id: 1 } },
            { $limit: qLimit },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            product: "$_id",
                            sales: "$sales",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    filter: label,
                    period: {
                        start,
                        end,
                    },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1,
                },
            },
        ]);

        return res.json(
            result?.[0] || {
                filter: label,
                period: { start, end },
                totalSales: 0,
                detail: [],
            },
        );
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getPopularProductByCategory = async (req, res) => {
    try {
        const { filter = "today", start: qStart, end: qEnd, limit } = req.query;
        const qLimit = limit ? Number(limit) : 10;

        let start;
        let end;
        let label = "";

        const now = new Date();

        /* =======================
           PERIOD SETUP
        ======================= */
        switch (filter) {
            case "today": {
                label = "Today";
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            }

            case "thisWeek": {
                label = "This Week";
                const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
                start = firstDay;
                end = new Date(lastDay);
                end.setDate(end.getDate() + 1);
                break;
            }

            case "thisMonth": {
                label = "This Month";
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            }

            case "thisYear": {
                label = "This Year";
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);
                break;
            }

            case "date": {
                label = "Date Range";
                if (!qStart) {
                    return errorResponse(res, {
                        statusCode: 400,
                        code: "BAD_REQUEST",
                        message: "start date is required",
                    });
                }

                const dStart = new Date(qStart);
                dStart.setHours(0, 0, 0, 0);
                start = new Date(dStart.toISOString());

                const dEnd = new Date(qEnd || qStart);
                dEnd.setHours(23, 59, 59, 999);
                end = new Date(dEnd.toISOString());
                break;
            }

            default:
                return errorResponse(res, {
                    statusCode: 400,
                    code: "INVALID_FILTER",
                    message: "Invalid filter",
                });
        }

        const qMatch = {
            status: "paid",
            createdAt: { $gte: start, $lt: end },
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        /* =======================
           AGGREGATION
        ======================= */
        const result = await Order.aggregate([
            { $unwind: "$orders" },
            { $match: qMatch },

            // total per product per category
            {
                $group: {
                    _id: {
                        product: "$orders.name",
                        category: { $toLower: "$orders.category" },
                    },
                    unit: { $first: "$orders.unit" },
                    sales: { $sum: "$orders.qty" },
                },
            },

            // urutkan produk terlaris
            { $sort: { sales: -1, "_id.product": 1 } },

            // group per category
            {
                $group: {
                    _id: "$_id.category",
                    totalSales: { $sum: "$sales" },
                    products: {
                        $push: {
                            product: "$_id.product",
                            unit: { $ifNull: ["$unit", "pcs"] },
                            sales: "$sales",
                        },
                    },
                },
            },

            // limit produk per category
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalSales: 1,
                    detail: { $slice: ["$products", qLimit] },
                },
            },

            // sort category by total sales
            { $sort: { totalSales: -1 } },

            // final shape
            {
                $group: {
                    _id: null,
                    filter: { $first: label },
                    period: {
                        $first: { start, end },
                    },
                    categories: {
                        $push: {
                            category: "$category",
                            totalSales: "$totalSales",
                            detail: "$detail",
                        },
                    },
                },
            },

            { $project: { _id: 0 } },
        ]);

        return res.json(
            result?.[0] || {
                filter: label,
                period: { start, end },
                categories: [],
            },
        );
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
