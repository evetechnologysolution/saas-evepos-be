import Order from "../../models/order.js";
import Expense from "../../models/expense.js";

// GETTING PROFIT LOSS
export const getProfitLoss = async (req, res) => {
    try {
        const dStart = new Date(req.query.start);
        dStart.setHours(0, 0, 0, 0);
        const start = new Date(dStart.toISOString()); // Konversi ke UTC string

        const dEnd = new Date(req.query.end || req.query.start);
        dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
        const end = new Date(dEnd.toISOString());

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
                $addFields: {
                    sales: {
                        $cond: { if: { $eq: ["$status", "paid"] }, then: "$billedAmount", else: 0 }
                    },
                    refund: {
                        $cond: { if: { $eq: ["$status", "refund"] }, then: { $multiply: ["$billedAmount", -1] }, else: 0 }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$sales" },
                    refund: { $sum: "$refund" },
                    discount: { $sum: "$discountPrice" },
                    productionCost: { $sum: "$productionAmount" },
                    serviceCharge: { $sum: "$serviceCharge" },
                    tax: { $sum: "$tax" },
                    deliveryPrice: { $sum: "$deliveryPrice" },
                }
            },
            {
                $project: {
                    _id: 0,
                    sales: 1,
                    refund: 1,
                    discount: 1,
                    productionCost: 1,
                    serviceCharge: 1,
                    tax: 1,
                    deliveryPrice: 1,
                }
            },
        ]);

        const expesnses = await Expense.aggregate([
            {
                $match: {
                    date: {
                        $gte: start,
                        $lt: end
                    }
                }
            },
            {
                $addFields: {
                    code1: {
                        $cond: { if: { $eq: ["$code", 1] }, then: "$amount", else: 0 }
                    },
                    code2: {
                        $cond: { if: { $eq: ["$code", 2] }, then: "$amount", else: 0 }
                    },
                    code3: {
                        $cond: { if: { $eq: ["$code", 3] }, then: "$amount", else: 0 }
                    },
                    code4: {
                        $cond: { if: { $eq: ["$code", 4] }, then: "$amount", else: 0 }
                    },
                    code5: {
                        $cond: { if: { $eq: ["$code", 5] }, then: "$amount", else: 0 }
                    },
                    code6: {
                        $cond: { if: { $eq: ["$code", 6] }, then: "$amount", else: 0 }
                    },
                    code7: {
                        $cond: { if: { $eq: ["$code", 7] }, then: "$amount", else: 0 }
                    },
                    code8: {
                        $cond: { if: { $eq: ["$code", 8] }, then: "$amount", else: 0 }
                    },
                }
            },
            {
                $group: {
                    _id: null,
                    expense1: { $sum: "$code1" },
                    expense2: { $sum: "$code2" },
                    expense3: { $sum: "$code3" },
                    expense4: { $sum: "$code4" },
                    expense5: { $sum: "$code5" },
                    expense6: { $sum: "$code6" },
                    expense7: { $sum: "$code7" },
                    expense8: { $sum: "$code8" },
                }
            },
            {
                $project: {
                    _id: 0,
                    expense1: 1,
                    expense2: 1,
                    expense3: 1,
                    expense4: 1,
                    expense5: 1,
                    expense6: 1,
                    expense7: 1,
                    expense8: 1,
                }
            },
        ]);


        const data = {
            start,
            end,
            originalSales: sales.length > 0 ? sales[0].sales - sales[0].refund : 0,
            sales: sales.length > 0 ? sales[0].sales - (sales[0].discount + sales[0].tax + sales[0].serviceCharge + sales[0].deliveryPrice) : 0,
            discount: sales.length > 0 ? sales[0].discount : 0,
            refund: sales.length > 0 ? sales[0].refund : 0,
            serviceCharge: sales.length > 0 ? sales[0].serviceCharge : 0,
            tax: sales.length > 0 ? sales[0].tax : 0,
            deliveryPrice: sales.length > 0 ? sales[0].deliveryPrice : 0,
            productionCost: sales.length > 0 ? sales[0].productionCost : 0,
            expenses: {
                code1: expesnses.length > 0 ? expesnses[0].expense1 : 0,
                code2: expesnses.length > 0 ? expesnses[0].expense2 : 0,
                code3: expesnses.length > 0 ? expesnses[0].expense3 : 0,
                code4: expesnses.length > 0 ? expesnses[0].expense4 : 0,
                code5: expesnses.length > 0 ? expesnses[0].expense5 : 0,
                code6: expesnses.length > 0 ? expesnses[0].expense6 : 0,
                code7: expesnses.length > 0 ? expesnses[0].expense7 : 0,
                code8: expesnses.length > 0 ? expesnses[0].expense8 : 0,
            }
        }

        return res.send(data);

    } catch (err) {
        return res.json({ message: err.message });
    }
};