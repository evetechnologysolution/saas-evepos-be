import Order from "../../../models/pos/order.js";
import { getFirstAndLastDayOfWeek } from "../../../lib/dateFormatter.js";

// GET POPULAR MENU THIS YEAR
export const getPopularThisYear = async (req, res) => {
    try {
        const year = new Date().getFullYear(); // this year
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);

        Order.aggregate([
            { $unwind: "$orders" },
            {
                $match: {
                    $and: [
                        { status: "paid" },
                        {
                            createdAt: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: "$orders.name",
                    sales: { $sum: "$orders.qty" },
                }
            },
            { $sort: { "sales": -1, "_id": 1 } },
            { $limit: 10 },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            product: "$_id",
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
                        end: end,
                    },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1,
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

// GET POPULAR MENU THIS MONTH
export const getPopularThisMonth = async (req, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        Order.aggregate([
            { $unwind: "$orders" },
            {
                $match: {
                    $and: [
                        { status: "paid" },
                        {
                            createdAt: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: "$orders.name",
                    sales: { $sum: "$orders.qty" },
                }
            },
            { $sort: { "sales": -1, "_id": 1 } },
            { $limit: 10 },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            product: "$_id",
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
                        end: end,
                    },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1,
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

// GET POPULAR MENU THIS WEEK
export const getPopularThisWeek = async (req, res) => {
    try {
        const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
        const start = firstDay;
        const end = new Date(lastDay.setDate(lastDay.getDate() + 1));

        Order.aggregate([
            { $unwind: "$orders" },
            {
                $match: {
                    $and: [
                        { status: "paid" },
                        {
                            createdAt: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: "$orders.name",
                    sales: { $sum: "$orders.qty" },
                }
            },
            { $sort: { "sales": -1, "_id": 1 } },
            { $limit: 10 },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            product: "$_id",
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
                        end: end,
                    },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1,
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

// GET POPULAR MENU TODAY
export const getPopularToday = async (req, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const today = curr.getDate(); // today
        const start = new Date(year, month, today);
        const end = new Date(year, month, today + 1);

        Order.aggregate([
            { $unwind: "$orders" },
            {
                $match: {
                    $and: [
                        { status: "paid" },
                        {
                            createdAt: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: "$orders.name",
                    sales: { $sum: "$orders.qty" },
                }
            },
            { $sort: { "sales": -1, "_id": 1 } },
            { $limit: 10 },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            product: "$_id",
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
                        end: end,
                    },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1,
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

// GET POPULAR MENU TODAY
export const getPopularByDate = async (req, res) => {
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
            { $unwind: "$orders" },
            {
                $match: {
                    $and: [
                        { status: "paid" },
                        {
                            createdAt: {
                                $gte: start,
                                $lte: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: "$orders.name",
                    sales: { $sum: "$orders.qty" },
                }
            },
            { $sort: { "sales": -1, "_id": 1 } },
            { $limit: 10 },
            {
                $group: {
                    _id: null,
                    detail: {
                        $push: {
                            product: "$_id",
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
                        end: end,
                    },
                    totalSales: { $sum: "$detail.sales" },
                    detail: 1,
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