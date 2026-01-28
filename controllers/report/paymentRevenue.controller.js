import Order from "../../models/pos/order.js";
import { getFirstAndLastDayOfWeek } from "../../lib/dateFormatter.js";
import { errorResponse } from "../../utils/errorResponse.js";

export const getPaymentRevenue = async (req, res) => {
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
                        code: "ERROR_REQUIRED",
                        message: "start date is required for date range filter",
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
                    message: "Invalid filter",
                });
        }

        const paymentsOrder = ["Card", "Cash", "E-Wallet", "Bank Transfer", "Online Payment", "QRIS"];

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
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: {
                            $cond: [{ $gt: ["$billedAmount", 0] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { "_id.payment": 1 } },
        ]);

        // 🔥 normalize response (SAMA seperti API lama)
        const value = paymentsOrder.map((p) => result.find((r) => r._id.payment === p)?.revenue || 0);

        const totalRevenue = value.reduce((a, b) => a + b, 0);
        const totalSales = result.reduce((a, b) => a + b.sales, 0);

        return res.json([
            {
                filter: label,
                period: { start, end },
                label: paymentsOrder,
                value,
                totalRevenue,
                totalSales,
            },
        ]);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
