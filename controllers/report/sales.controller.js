import Order from "../../models/pos/order.js";
import { getFirstAndLastDayOfWeek, getDatesInRange, formatDate } from "../../lib/dateFormatter.js";
import { errorResponse } from "../../utils/errorResponse.js";

export const getSales = async (req, res) => {
    try {
        const { filter = "monthly", start: qStart, end: qEnd } = req.query;

        let start,
            end,
            label = [],
            groupBy,
            filterName;

        const now = new Date();

        /* =======================
        PERIOD SETUP
        ======================= */
        switch (filter) {
            case "thisWeek": {
                const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
                start = firstDay;
                end = new Date(lastDay.setDate(lastDay.getDate() + 1));
                label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                groupBy = {
                    $dayOfWeek: { date: "$createdAt", timezone: "Asia/Jakarta" },
                };
                filterName = "This Week";
                break;
            }

            case "thisMonth": {
                const y = now.getFullYear();
                const m = now.getMonth();
                start = new Date(y, m, 1);
                end = new Date(y, m + 1, 1);
                label = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
                groupBy = {
                    $dayOfMonth: { date: "$createdAt", timezone: "Asia/Jakarta" },
                };
                filterName = "This Month";
                break;
            }

            case "date": {
                const dStart = new Date(qStart || now);
                dStart.setHours(0, 0, 0, 0);
                const dEnd = new Date(qEnd || qStart || now);
                dEnd.setHours(23, 59, 59, 999);

                start = dStart;
                end = dEnd;

                label = getDatesInRange(start, end);
                groupBy = {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt",
                        timezone: "Asia/Jakarta",
                    },
                };
                filterName = "Date Range";
                break;
            }

            default: {
                // monthly
                const year = now.getFullYear();
                start = new Date(year, 0, 1);
                end = new Date(year + 1, 0, 1);
                label = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                groupBy = {
                    $month: { date: "$createdAt", timezone: "Asia/Jakarta" },
                };
                filterName = "Monthly";
            }
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
            {
                $match: qMatch,
            },
            {
                $group: {
                    _id: {
                        time: groupBy,
                        type: {
                            $switch: {
                                branches: [{ case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" }],
                                default: "Onsite",
                            },
                        },
                    },
                    total: { $count: {} },
                },
            },
            { $sort: { "_id.time": 1 } },
            {
                $group: {
                    _id: "$_id.type",
                    label: { $push: "$_id.time" },
                    value: { $push: "$total" },
                },
            },
        ]);

        /* =======================
        INITIAL DATA
        ======================= */
        const initialData = {
            filter: filterName,
            period: { start, end },
            label,
            sales: [
                { name: "Onsite", data: Array(label.length).fill(0) },
                { name: "Delivery", data: Array(label.length).fill(0) },
            ],
        };

        /* =======================
        MAPPING RESULT
        ======================= */
        result.forEach((order) => {
            const target = initialData.sales.find((s) => s.name === order._id);
            if (!target) return;

            order.label.forEach((row, idx) => {
                const key =
                    filter === "monthly"
                        ? label[row - 1]
                        : filter === "thisWeek"
                          ? label[row - 1]
                          : filter === "date"
                            ? formatDate(row)
                            : `${row}`;

                const i = initialData.label.indexOf(key);
                if (i !== -1) target.data[i] = order.value[idx];
            });
        });

        return res.send([initialData]);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
