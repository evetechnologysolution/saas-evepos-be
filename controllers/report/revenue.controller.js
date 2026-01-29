import Order from "../../models/pos/order.js";
import { getFirstAndLastDayOfWeek } from "../../lib/dateFormatter.js";
import { errorResponse } from "../../utils/errorResponse.js";

export const getRevenue = async (req, res) => {
    try {
        const { filter = "today", start: qStart, end: qEnd } = req.query;

        let start;
        let end;
        let label = "";

        const now = new Date();

        switch (filter) {
            case "today":
                label = "Today";
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;

            case "thisWeek": {
                label = "This Week";
                const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
                start = firstDay;
                end = new Date(lastDay);
                end.setDate(end.getDate() + 1);
                break;
            }

            case "thisMonth":
                label = "This Month";
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;

            case "thisYear":
                label = "This Year";
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);
                break;

            case "date":
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

            default:
                return errorResponse(res, {
                    statusCode: 400,
                    code: "INVALID_FILTER",
                    message: "Invalid filter value",
                });
        }

        const qMatch = {
            status: { $in: ["paid", "refund"] },
            paymentDate: { $gte: start, $lt: end },
        };

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const result = await Order.aggregate([
            {
                $match: qMatch,
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ["$orderType", "delivery"] },
                                        then: "Delivery",
                                    },
                                ],
                                default: "Onsite",
                            },
                        },
                    },
                    donation: { $sum: "$donation" },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: {
                            $cond: [{ $gt: ["$billedAmount", 0] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { "_id.type": -1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            type: "$_id.type",
                            donation: "$donation",
                            revenue: "$revenue",
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
                    totalDonation: { $sum: "$detail.donation" },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1,
                },
            },
        ]);

        return res.send(result);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
