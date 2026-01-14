import Order from "../../models/order.js";
import { getFirstAndLastDayOfWeek } from "../../lib/dateFormatter.js";

// GETTING ALL REVENUE & SALES
export const getAllRevenue = async (_, res) => {
    try {
        Order.aggregate([
            {
                $match: {
                    $or: [
                        { status: "paid" },
                        { status: "refund" },
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$billedAmount" },
                    sales: { $count: {} },
                }
            },
            {
                $project: {
                    _id: 0,
                    revenue: 1,
                    sales: 1,
                }
            }
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES YEARLY
export const getRevenueYearly = async (_, res) => {
    try {
        Order.aggregate([
            {
                $match: {
                    $or: [
                        { status: "paid" },
                        { status: "refund" },
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $year: {
                            // date: "$date",
                            date: "$paymentDate",
                            timezone: "Asia/Jakarta"
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: { $count: {} }
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id",
                    revenue: 1,
                    sales: 1
                }
            }
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES MONTHLY
export const getRevenueMonthly = async (_, res) => {
    try {
        const year = new Date().getFullYear(); // this year
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            // date: {
                            paymentDate: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $month: {
                            // date: "$date",
                            date: "$paymentDate",
                            timezone: "Asia/Jakarta"
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    count: { $count: {} }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    revenue: 1,
                    count: 1
                }
            },
            { $sort: { month: 1 } }
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES WEEKLY
export const getRevenueWeekly = async (_, res) => {
    try {
        const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
        const start = firstDay;
        const end = new Date(lastDay.setDate(lastDay.getDate() + 1));

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            // date: {
                            paymentDate: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $dayOfWeek: {
                            // date: "$date",
                            date: "$paymentDate",
                            timezone: "Asia/Jakarta"
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    count: { $count: {} }
                }
            },
            {
                $project: {
                    _id: 0,
                    day: "$_id",
                    revenue: 1,
                    count: 1
                }
            },
            { $sort: { day: 1 } }
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES THIS YEAR
export const getRevenueThisYear = async (_, res) => {
    try {
        const year = new Date().getFullYear(); // this year
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            // date: {
                            paymentDate: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    donation: { $sum: "$donation" },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                    // sales: { $count: {} }
                }
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
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "This Year",
                    totalDonation: { $sum: "$detail.donation" },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES THIS MONTH
export const getRevenueThisMonth = async (_, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            // date: {
                            paymentDate: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    donation: { $sum: "$donation" },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
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
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "This Month",
                    totalDonation: { $sum: "$detail.donation" },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES THIS WEEK
export const getRevenueThisWeek = async (_, res) => {
    try {
        const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
        const start = firstDay;
        const end = new Date(lastDay.setDate(lastDay.getDate() + 1));

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            // date: {
                            paymentDate: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    donation: { $sum: "$donation" },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
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
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "This Week",
                    totalDonation: { $sum: "$detail.donation" },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES TODAY
export const getRevenueToday = async (_, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const today = curr.getDate(); // today
        const start = new Date(year, month, today);
        const end = new Date(year, month, today + 1);

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            // date: {
                            paymentDate: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    donation: { $sum: "$donation" },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
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
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "Today",
                    period: {
                        start: start,
                        end: start,
                    },
                    totalDonation: { $sum: "$detail.donation" },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES TODAY
export const getRevenueByDate = async (req, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const today = curr.getDate(); // today
        let start = new Date(year, month, today, 0, 0, 0, 0);
        let end = new Date(year, month, today, 23, 59, 59, 999);

        if (req.query.start) {
            const dStart = new Date(req.query.start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string
            start = fixStart;

            const dEnd = new Date(req.query.end ? req.query.end : req.query.start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());
            end = fixEnd;
        }

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            // date: {
                            paymentDate: {
                                $gte: start,
                                $lte: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    donation: { $sum: "$donation" },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
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
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "Date",
                    period: {
                        start: start,
                        end: start,
                    },
                    totalDonation: { $sum: "$detail.donation" },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES LAST 365 DAYS
export const getRevenue365Days = async (_, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const today = curr.getDate(); // today
        const start = new Date(year, month, today);

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            $expr: {
                                $gt: [
                                    // "$date",
                                    "$paymentDate",
                                    { $dateSubtract: { startDate: start, unit: "day", amount: 364, timezone: "Asia/Jakarta" } }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: { $count: {} }
                }
            },
            { $sort: { "_id.type": -1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            type: "$_id.type",
                            revenue: "$revenue",
                            sales: "$sales",
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "365 Days",
                    period: {
                        start: { $dateSubtract: { startDate: start, unit: "day", amount: 364, timezone: "Asia/Jakarta" } },
                        end: { $dateSubtract: { startDate: start, unit: "day", amount: 0, timezone: "Asia/Jakarta" } }
                    },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES LAST 30 DAYS
export const getRevenue30Days = async (_, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const today = curr.getDate(); // today
        const start = new Date(year, month, today);

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            $expr: {
                                $gt: [
                                    // "$date",
                                    "$paymentDate",
                                    { $dateSubtract: { startDate: start, unit: "day", amount: 29, timezone: "Asia/Jakarta" } }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: { $count: {} }
                }
            },
            { $sort: { "_id.type": -1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            type: "$_id.type",
                            revenue: "$revenue",
                            sales: "$sales",
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "30 Days",
                    period: {
                        start: { $dateSubtract: { startDate: start, unit: "day", amount: 29, timezone: "Asia/Jakarta" } },
                        end: { $dateSubtract: { startDate: start, unit: "day", amount: 0, timezone: "Asia/Jakarta" } }
                    },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES LAST 7 DAYS
export const getRevenue7Days = async (_, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const today = curr.getDate(); // today
        const start = new Date(year, month, today);

        Order.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            $expr: {
                                $gt: [
                                    // "$date",
                                    "$paymentDate",
                                    { $dateSubtract: { startDate: start, unit: "day", amount: 6, timezone: "Asia/Jakarta" } }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: { $count: {} }
                }
            },
            { $sort: { "_id.type": -1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            type: "$_id.type",
                            revenue: "$revenue",
                            sales: "$sales",
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    filter: "7 Days",
                    period: {
                        start: { $dateSubtract: { startDate: start, unit: "day", amount: 6, timezone: "Asia/Jakarta" } },
                        end: { $dateSubtract: { startDate: start, unit: "day", amount: 0, timezone: "Asia/Jakarta" } }
                    },
                    totalRevenue: { $sum: "$detail.revenue" },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1
                }
            },
        ]).exec((err, result) => {
            if (err) {
                return res.send(err);
            }
            if (result) {
                return res.send(result);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};