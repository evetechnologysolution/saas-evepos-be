import Order from "../../models/order.js";
import { getFirstAndLastDayOfWeek, getDatesInRange, formatDate } from "../../lib/dateFormatter.js";

// GETTING SALES MONTHLY
export const getSalesMonthly = async (_, res) => {
    try {
        const year = new Date().getFullYear(); // this year
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);

        Order.aggregate([
            {
                $match:
                {
                    $and: [
                        { status: "paid" },
                        {
                            date: {
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
                        month: {
                            $month: {
                                date: "$date",
                                timezone: "Asia/Jakarta"
                            }
                        },
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    myCount: { $count: {} }
                }
            },
            { $sort: { "_id.month": 1 } },
            {
                $group: {
                    _id: "$_id.type",
                    month: {
                        $push: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                                    { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                                    { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                                    { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                                    { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                    { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                                    { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                                    { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                                    { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                                    { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                                    { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                                    { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                                ]
                            }
                        }
                    },
                    total: { $push: "$myCount" },
                }
            },
            { $sort: { "_id": -1 } },
            {
                $group: {
                    _id: null,
                    sales: {
                        $push: {
                            name: "$_id",
                            label: "$month",
                            value: "$total",
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                }
            },
        ]).exec((err, result) => {
            const initialData = {
                filter: "Monthly",
                period: {
                    start: start,
                    end: end,
                },
                label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                sales: [
                    {
                        name: "Onsite",
                        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    },
                    {
                        name: "Delivery",
                        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    },
                ]
            }

            if (err) {
                return res.send(err);
            }

            if (result.length > 0) {
                result.map((order) => {
                    order.sales.map((item) => {
                        item.label.map((row, index) => {
                            initialData.label.map((field, i) => {
                                if (field === row) {
                                    if (item.name === initialData.sales[0].name) {
                                        initialData.sales[0].data.splice(i, 1, item.value[index]);
                                    }
                                    if (item.name === initialData.sales[1].name) {
                                        initialData.sales[1].data.splice(i, 1, item.value[index]);
                                    }
                                }
                            })
                        })
                    })
                    return initialData;
                })
            }
            return res.send([initialData]);
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING SALES THIS MONTH
export const getSalesThisMonth = async (_, res) => {
    try {
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        Order.aggregate([
            {
                $match:
                {
                    $and: [
                        { status: "paid" },
                        {
                            date: {
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
                        day: {
                            $dayOfMonth: {
                                date: "$date",
                                timezone: "Asia/Jakarta"
                            }
                        },
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    myCount: { $count: {} }
                }
            },
            { $sort: { "_id.day": 1 } },
            {
                $group: {
                    _id: "$_id.type",
                    day: { $push: "$_id.day" },
                    total: { $push: "$myCount" },
                }
            },
            { $sort: { "_id": -1 } },
            {
                $group: {
                    _id: null,
                    sales: {
                        $push: {
                            name: "$_id",
                            label: "$day",
                            value: "$total",
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                }
            },
        ]).exec((err, result) => {
            const initialData = {
                filter: "This Month",
                period: {
                    start: start,
                    end: end,
                },
                label: [
                    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
                    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
                    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
                ],
                sales: [
                    {
                        name: "Onsite",
                        data: [
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                        ]
                    },
                    {
                        name: "Delivery",
                        data: [
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                        ]
                    },
                ]
            }

            if (err) {
                return res.send(err);
            }

            if (result.length > 0) {
                result.map((order) => {
                    order.sales.map((item) => {
                        item.label.map((row, index) => {
                            initialData.label.map((field, i) => {
                                if (parseInt(field) === row) {
                                    if (item.name === initialData.sales[0].name) {
                                        initialData.sales[0].data.splice(i, 1, item.value[index]);
                                    }
                                    if (item.name === initialData.sales[1].name) {
                                        initialData.sales[1].data.splice(i, 1, item.value[index]);
                                    }
                                }
                            })
                        })
                    })
                    return initialData;
                })
            }
            return res.send([initialData]);
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING SALES WEEKLY
export const getSalesThisWeek = async (_, res) => {
    try {
        const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
        const start = firstDay;
        const end = new Date(lastDay.setDate(lastDay.getDate() + 1));

        Order.aggregate([
            {
                $match:
                {
                    $and: [
                        { status: "paid" },
                        {
                            date: {
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
                        day: {
                            $dayOfWeek: {
                                date: "$date",
                                timezone: "Asia/Jakarta"
                            }
                        },
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    myCount: { $count: {} }
                }
            },
            { $sort: { "_id.day": 1 } },
            {
                $group: {
                    _id: "$_id.type",
                    day: {
                        $push: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$_id.day", 1] }, then: "Sun" },
                                    { case: { $eq: ["$_id.day", 2] }, then: "Mon" },
                                    { case: { $eq: ["$_id.day", 3] }, then: "Tue" },
                                    { case: { $eq: ["$_id.day", 4] }, then: "Wed" },
                                    { case: { $eq: ["$_id.day", 5] }, then: "Thu" },
                                    { case: { $eq: ["$_id.day", 6] }, then: "Fri" },
                                    { case: { $eq: ["$_id.day", 7] }, then: "Sat" },
                                ]
                            }
                        }
                    },
                    total: { $push: "$myCount" },
                }
            },
            { $sort: { "_id": -1 } },
            {
                $group: {
                    _id: null,
                    sales: {
                        $push: {
                            name: "$_id",
                            label: "$day",
                            value: "$total",
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                }
            },
        ]).exec((err, result) => {
            const initialData = {
                filter: "This Week",
                period: {
                    start: start,
                    end: end,
                },
                label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                sales: [
                    {
                        name: "Onsite",
                        data: [0, 0, 0, 0, 0, 0, 0]
                    },
                    {
                        name: "Delivery",
                        data: [0, 0, 0, 0, 0, 0, 0]
                    },
                ]
            }

            if (err) {
                return res.send(err);
            }

            if (result.length > 0) {
                result.map((order) => {
                    order.sales.map((item) => {
                        item.label.map((row, index) => {
                            initialData.label.map((field, i) => {
                                if (field === row) {
                                    if (item.name === initialData.sales[0].name) {
                                        initialData.sales[0].data.splice(i, 1, item.value[index]);
                                    }
                                    if (item.name === initialData.sales[1].name) {
                                        initialData.sales[1].data.splice(i, 1, item.value[index]);
                                    }
                                }
                            })
                        })
                    })
                    return initialData;
                })
            }
            return res.send([initialData]);
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};

// GETTING SALES BY DATE
export const getSalesByDate = async (req, res) => {
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
                $match:
                {
                    $and: [
                        { status: "paid" },
                        {
                            date: {
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
                        day: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$date",
                                timezone: "Asia/Jakarta"
                            }
                        },
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$orderType", "delivery"] }, then: "Delivery" },
                                ],
                                default: "Onsite"
                            }
                        }
                    },
                    myCount: { $count: {} }
                }
            },
            { $sort: { "_id.day": 1 } },
            {
                $group: {
                    _id: "$_id.type",
                    day: { $push: "$_id.day" },
                    total: { $push: "$myCount" },
                }
            },
            { $sort: { "_id": -1 } },
            {
                $group: {
                    _id: null,
                    sales: {
                        $push: {
                            name: "$_id",
                            label: "$day",
                            value: "$total",
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                }
            },
        ]).exec((err, result) => {
            const labelDate = getDatesInRange(start, end);
            let arr1 = [];
            let arr2 = [];
            let arr3 = [];
            for (let n = 0; n < labelDate.length; n++) {
                arr1.push(0);
                arr2.push(0);
                arr3.push(0);
            }

            const initialData = {
                filter: "Date",
                period: {
                    start: start,
                    end: end,
                },
                label: labelDate,
                sales: [
                    {
                        name: "Onsite",
                        data: arr1
                    },
                    {
                        name: "Delivery",
                        data: arr2
                    },
                ]
            }

            if (err) {
                return res.send(err);
            }

            if (result.length > 0) {
                result.map((order) => {
                    order.sales.map((item) => {
                        item.label.map((row, index) => {
                            initialData.label.map((field, i) => {
                                if (field === formatDate(row)) {
                                    if (item.name === initialData.sales[0].name) {
                                        initialData.sales[0].data.splice(i, 1, item.value[index]);
                                    }
                                    if (item.name === initialData.sales[1].name) {
                                        initialData.sales[1].data.splice(i, 1, item.value[index]);
                                    }
                                }
                            })
                        })
                    })
                    return initialData;
                })
            }
            return res.send([initialData]);
        })
    } catch (err) {
        return res.json({ message: err.message });
    }
};