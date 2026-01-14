import Order from "../../models/order.js";
// import Expense from "../../models/expense.js";
import Balance from "../../models/cashBalance.js";
import { getFirstAndLastDayOfWeek, getFirstAndLastDayOfLastWeek, } from "../../lib/dateFormatter.js";

// GETTING THIS WEEK
export const getNeraca = async (req, res) => {
    try {
        const { firstDay, lastDay } = getFirstAndLastDayOfWeek();
        const { firstDayOfLastWeek, lastDayOfLastWeek } = getFirstAndLastDayOfLastWeek();
        const curr = new Date(); // this date
        const year = curr.getFullYear(); // this year
        const month = curr.getMonth(); // this month

        let start = firstDay;
        let initialEndDate = new Date(lastDay);
        let endDate = new Date(lastDay);
        let end = new Date(initialEndDate.setDate(initialEndDate.getDate() + 1));

        let prevStart = firstDayOfLastWeek;
        let initialPrevEndDate = new Date(lastDayOfLastWeek);
        let prevEndDate = new Date(lastDayOfLastWeek);
        let prevEnd = new Date(initialPrevEndDate.setDate(initialPrevEndDate.getDate() + 1));

        if (req.query.filter === 'this-week') {
            start = firstDay;
            initialEndDate = new Date(lastDay);
            endDate = new Date(lastDay);
            end = new Date(initialEndDate.setDate(initialEndDate.getDate() + 1));

            prevStart = firstDayOfLastWeek;
            initialPrevEndDate = new Date(lastDayOfLastWeek);
            prevEndDate = new Date(lastDayOfLastWeek);
            prevEnd = new Date(initialPrevEndDate.setDate(initialPrevEndDate.getDate() + 1));
        }

        if (req.query.filter === 'this-month') {
            start = new Date(year, month, 1);
            endDate = new Date(year, month + 1, 1);
            endDate = new Date(endDate.setDate(endDate.getDate() - 1));
            end = new Date(year, month + 1, 1);

            prevStart = new Date(year, month - 1, 1);
            prevEndDate = new Date(year, month, 1);
            prevEndDate = new Date(prevEndDate.setDate(prevEndDate.getDate() - 1));
            prevEnd = new Date(year, month, 1);
        }

        if (req.query.filter === 'this-year') {
            start = new Date(year, 0, 1);
            endDate = new Date(year + 1, 0, 1);
            endDate = new Date(endDate.setDate(endDate.getDate() - 1));
            end = new Date(year + 1, 0, 1);

            prevStart = new Date(year - 1, 0, 1);
            prevEndDate = new Date(year, 0, 1);
            prevEndDate = new Date(prevEndDate.setDate(prevEndDate.getDate() - 1));
            prevEnd = new Date(year, 0, 1);
        }

        // sales this period
        const sales = await Order.aggregate([
            {
                $match:
                {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
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
                    _id: null,
                    sales: { $sum: "$billedAmount" },
                    tax: { $sum: "$tax" },
                }
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                    tax: 1,
                }
            },
        ]);

        // sales prev period
        const prevSales = await Order.aggregate([
            {
                $match:
                {
                    $and: [
                        {
                            $or: [
                                { status: "paid" },
                                { status: "refund" },
                            ]
                        },
                        {
                            paymentDate: {
                                $gte: prevStart,
                                $lt: prevEnd
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$billedAmount" },
                    tax: { $sum: "$tax" },
                }
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                    tax: 1,
                }
            },
        ]);

        // cash flow
        const cashFlow = await Balance.aggregate([
            {
                $match:
                {
                    $and: [
                        {
                            isOpen: { $ne: true },
                        },
                        {
                            startDate: {
                                $gte: start,
                                $lt: end
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$sales" },
                    cashIn: { $sum: "$cashIn" },
                    cashOut: { $sum: "$cashOut" },
                    refund: { $sum: "$refund" },
                    serviceCharge: { $sum: "$serviceCharge" },
                    tax: { $sum: "$tax" },
                }
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
                }
            },
        ]);

        const data = {
            start,
            end: endDate,
            prevStart,
            prevEnd: prevEndDate,
            cashIn: cashFlow.length > 0 ? cashFlow[0].cashIn : 0,
            sales: sales.length > 0 ? sales[0].sales - sales[0].tax : 0,
            tax: sales.length > 0 ? sales[0].tax : 0,
            prevSales: prevSales.length > 0 ? prevSales[0].sales - prevSales[0].tax : 0,
            prevTax: prevSales.length > 0 ? prevSales[0].tax : 0,
        }

        return res.send(data);

    } catch (err) {
        return res.json({ message: err.message });
    }
};