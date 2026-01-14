import Order from "../../models/order.js";
import { getFirstAndLastDayOfWeek } from "../../lib/dateFormatter.js";

// GETTING REVENUE & SALES OVERVIEW THIS YEAR
export const getPaymentRevenueThisYear = async (_, res) => {
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
                        // payment: "$payment"
                        payment: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$payment", "Cash"] }, then: "Cash" },
                                    { case: { $eq: ["$payment", "Card"] }, then: "Card" },
                                    { case: { $eq: ["$payment", "Bank Transfer"] }, then: "Bank Transfer" },
                                    { case: { $eq: ["$payment", "Online Payment"] }, then: "Online Payment" },
                                    { case: { $eq: ["$payment", "QRIS"] }, then: "QRIS" },
                                ],
                                default: "E-Wallet"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                    // sales: { $count: {} }
                }
            },
            { $sort: { "_id.payment": 1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            payment: "$_id.payment",
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
                    period: {
                        start: start,
                        end: start,
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
                const initialData = [{
                    filter: "This Year",
                    period: {
                        start: start,
                        end: start,
                    },
                    label: ["Card", "Cash", "E-Wallet", "Bank Transfer", "Online Payment", "QRIS"],
                    value: [0, 0, 0, 0, 0],
                    totalRevenue: result[0]?.totalRevenue || 0,
                    totalSales: result[0]?.totalSales || 0,
                }];

                if (result.length > 0) {
                    result.map((item) => {
                        item.detail.map((field) => {
                            initialData[0].label.map((row, index) => {
                                if (field.payment === row) {
                                    initialData[0].value.splice(index, 1, field.revenue);
                                }
                            })
                        })
                    })
                }
                return res.send(initialData);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES OVERVIEW THIS MONTH
export const getPaymentRevenueThisMonth = async (_, res) => {
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
                        // payment: "$payment"
                        payment: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$payment", "Cash"] }, then: "Cash" },
                                    { case: { $eq: ["$payment", "Card"] }, then: "Card" },
                                    { case: { $eq: ["$payment", "Bank Transfer"] }, then: "Bank Transfer" },
                                    { case: { $eq: ["$payment", "Online Payment"] }, then: "Online Payment" },
                                    { case: { $eq: ["$payment", "QRIS"] }, then: "QRIS" },
                                ],
                                default: "E-Wallet"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
            },
            { $sort: { "_id.payment": 1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            payment: "$_id.payment",
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
                    period: {
                        start: start,
                        end: start,
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
                const initialData = [{
                    filter: "This Month",
                    period: {
                        start: start,
                        end: start,
                    },
                    label: ["Card", "Cash", "E-Wallet", "Bank Transfer", "Online Payment", "QRIS"],
                    value: [0, 0, 0, 0, 0],
                    totalRevenue: result[0]?.totalRevenue || 0,
                    totalSales: result[0]?.totalSales || 0,
                }];

                if (result.length > 0) {
                    result.map((item) => {
                        item.detail.map((field) => {
                            initialData[0].label.map((row, index) => {
                                if (field.payment === row) {
                                    initialData[0].value.splice(index, 1, field.revenue);
                                }
                            })
                        })
                    })
                }
                return res.send(initialData);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES OVERVIEW THIS WEEK
export const getPaymentRevenueThisWeek = async (_, res) => {
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
                        // payment: "$payment"
                        payment: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$payment", "Cash"] }, then: "Cash" },
                                    { case: { $eq: ["$payment", "Card"] }, then: "Card" },
                                    { case: { $eq: ["$payment", "Bank Transfer"] }, then: "Bank Transfer" },
                                    { case: { $eq: ["$payment", "Online Payment"] }, then: "Online Payment" },
                                    { case: { $eq: ["$payment", "QRIS"] }, then: "QRIS" },
                                ],
                                default: "E-Wallet"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
            },
            { $sort: { "_id.payment": 1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            payment: "$_id.payment",
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
                    period: {
                        start: start,
                        end: start,
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
                const initialData = [{
                    filter: "This Week",
                    period: {
                        start: start,
                        end: start,
                    },
                    label: ["Card", "Cash", "E-Wallet", "Bank Transfer", "Online Payment", "QRIS"],
                    value: [0, 0, 0, 0, 0],
                    totalRevenue: result[0]?.totalRevenue || 0,
                    totalSales: result[0]?.totalSales || 0,
                }];

                if (result.length > 0) {
                    result.map((item) => {
                        item.detail.map((field) => {
                            initialData[0].label.map((row, index) => {
                                if (field.payment === row) {
                                    initialData[0].value.splice(index, 1, field.revenue);
                                }
                            })
                        })
                    })
                }
                return res.send(initialData);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES OVERVIEW TODAY
export const getPaymentRevenueToday = async (_, res) => {
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
                        // payment: "$payment"
                        payment: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$payment", "Cash"] }, then: "Cash" },
                                    { case: { $eq: ["$payment", "Card"] }, then: "Card" },
                                    { case: { $eq: ["$payment", "Bank Transfer"] }, then: "Bank Transfer" },
                                    { case: { $eq: ["$payment", "Online Payment"] }, then: "Online Payment" },
                                    { case: { $eq: ["$payment", "QRIS"] }, then: "QRIS" },
                                ],
                                default: "E-Wallet"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
            },
            { $sort: { "_id.payment": 1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            payment: "$_id.payment",
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
                const initialData = [{
                    filter: "Today",
                    period: {
                        start: start,
                        end: start,
                    },
                    label: ["Card", "Cash", "E-Wallet", "Bank Transfer", "Online Payment", "QRIS"],
                    value: [0, 0, 0, 0, 0],
                    totalRevenue: result[0]?.totalRevenue || 0,
                    totalSales: result[0]?.totalSales || 0,
                }];

                if (result.length > 0) {
                    result.map((item) => {
                        item.detail.map((field) => {
                            initialData[0].label.map((row, index) => {
                                if (field.payment === row) {
                                    initialData[0].value.splice(index, 1, field.revenue);
                                }
                            })
                        })
                    })
                }
                return res.send(initialData);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING REVENUE & SALES OVERVIEW TODAY
export const getPaymentRevenueByDate = async (req, res) => {
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
                        // payment: "$payment"
                        payment: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$payment", "Cash"] }, then: "Cash" },
                                    { case: { $eq: ["$payment", "Card"] }, then: "Card" },
                                    { case: { $eq: ["$payment", "Bank Transfer"] }, then: "Bank Transfer" },
                                    { case: { $eq: ["$payment", "Online Payment"] }, then: "Online Payment" },
                                    { case: { $eq: ["$payment", "QRIS"] }, then: "QRIS" },
                                ],
                                default: "E-Wallet"
                            }
                        }
                    },
                    revenue: { $sum: "$billedAmount" },
                    sales: {
                        $sum: { $cond: { if: { $gt: ["$billedAmount", 0] }, then: 1, else: 0 } }
                    }
                }
            },
            { $sort: { "_id.payment": 1 } },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            payment: "$_id.payment",
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
                const initialData = [{
                    filter: "Date",
                    period: {
                        start: start,
                        end: start,
                    },
                    label: ["Card", "Cash", "E-Wallet", "Bank Transfer", "Online Payment", "QRIS"],
                    value: [0, 0, 0, 0, 0],
                    totalRevenue: result[0]?.totalRevenue || 0,
                    totalSales: result[0]?.totalSales || 0,
                }];

                if (result.length > 0) {
                    result.map((item) => {
                        item.detail.map((field) => {
                            initialData[0].label.map((row, index) => {
                                if (field.payment === row) {
                                    initialData[0].value.splice(index, 1, field.revenue);
                                }
                            })
                        })
                    })
                }
                return res.send(initialData);
            }
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};