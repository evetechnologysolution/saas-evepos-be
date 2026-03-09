import Order from "../../models/pos/order.js";
import Expense from "../../models/expense.js";
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
          roundingAmount: { $sum: "$roundingAmount" },
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
              roundingAmount: "$roundingAmount",
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
          totalRounding: { $sum: "$detail.roundingAmount" },
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

export const getRevenueV2 = async (req, res) => {
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

    const qMatchExpense = {
      createdAt: { $gte: start, $lt: end },
    };

    if (req.userData) {
      qMatch.tenantRef = req.userData?.tenantRef;
      qMatch.outletRef = req.userData?.outletRef;

      qMatchExpense.tenantRef = req.userData?.tenantRef;
      qMatchExpense.outletRef = req.userData?.outletRef;
    }

    const [result, expenseResult] = await Promise.all([
      Order.aggregate([
        { $match: qMatch },
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
            roundingAmount: { $sum: "$roundingAmount" },
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
                roundingAmount: "$roundingAmount",
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
            period: { start, end },
            totalRounding: { $sum: "$detail.roundingAmount" },
            totalRevenue: { $sum: "$detail.revenue" },
            totalSales: { $sum: "$detail.sales" },
            detail: 1,
          },
        },
      ]),
      Expense.aggregate([
        { $match: qMatchExpense },
        {
          $group: {
            _id: "$code",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $group: {
            _id: null,
            detail: {
              $push: {
                code: "$_id",
                totalAmount: "$totalAmount",
                count: "$count",
              },
            },
            totalExpense: { $sum: "$totalAmount" },
          },
        },
        {
          $project: {
            _id: 0,
            totalExpense: 1,
            detail: 1,
          },
        },
      ]),
    ]);

    const revenueData = result[0] || {
      totalRounding: 0,
      totalRevenue: 0,
      totalSales: 0,
      detail: [],
    };

    const expenseData = expenseResult[0] || {
      totalExpense: 0,
      detail: [],
    };

    return res.send({
      filter: label,
      period: { start, end },
      ...revenueData,
      expense: expenseData,
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      code: "SERVER_ERROR",
      message: err.message || "Terjadi kesalahan pada server",
    });
  }
};
