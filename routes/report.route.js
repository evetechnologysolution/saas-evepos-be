import express from "express";
import {
    getRevenueThisYear,
    getRevenueThisMonth,
    getRevenueThisWeek,
    getRevenueToday,
    getRevenueByDate
} from "../controllers/report/revenue.controller.js";
import {
    getPaymentRevenueThisYear,
    getPaymentRevenueThisMonth,
    getPaymentRevenueThisWeek,
    getPaymentRevenueToday,
    getPaymentRevenueByDate,
} from "../controllers/report/paymentRevenue.controller.js";
import {
    getSalesMonthly,
    getSalesThisMonth,
    getSalesThisWeek,
    getSalesByDate
} from "../controllers/report/sales.controller.js";
import {
    getPopularThisYear,
    getPopularThisMonth,
    getPopularThisWeek,
    getPopularToday,
    getPopularByDate
} from "../controllers/report/popular.controller.js";
import {
    getProfitLoss
} from "../controllers/report/profitLoss.controller.js";
import {
    getNeraca
} from "../controllers/report/neraca.controller.js";

const router = express.Router();

// GETTING REVENUE & SALES THIS YEAR
// GET http://localhost:5000/api/report/revenue/this-year
router.get("/revenue/this-year", getRevenueThisYear);

// GETTING REVENUE & SALES THIS MONTH
// GET http://localhost:5000/api/report/revenue/this-month
router.get("/revenue/this-month", getRevenueThisMonth);

// GETTING REVENUE & SALES THIS WEEK
// GET http://localhost:5000/api/report/revenue/this-week
router.get("/revenue/this-week", getRevenueThisWeek);

// GETTING REVENUE & SALES TODAY
// GET http://localhost:5000/api/report/revenue/today
router.get("/revenue/today", getRevenueToday);

// GETTING REVENUE & SALES BY DATE
// GET http://localhost:5000/api/report/revenue/date
router.get("/revenue/date", getRevenueByDate);

// GETTING REVENUE & SALES OVERVIEW THIS YEAR
// GET http://localhost:5000/api/report/revenue-overview/this-year
router.get("/revenue-overview/this-year", getPaymentRevenueThisYear);

// GETTING REVENUE & SALES OVERVIEW THIS MONTH
// GET http://localhost:5000/api/report/revenue-overview/this-month
router.get("/revenue-overview/this-month", getPaymentRevenueThisMonth);

// GETTING REVENUE & SALES OVERVIEW THIS WEEK
// GET http://localhost:5000/api/report/revenue-overview/this-week
router.get("/revenue-overview/this-week", getPaymentRevenueThisWeek);

// GETTING REVENUE & SALES OVERVIEW TODAY
// GET http://localhost:5000/api/report/revenue-overview/today
router.get("/revenue-overview/today", getPaymentRevenueToday);

// GETTING REVENUE & SALES OVERVIEW BY DATE
// GET http://localhost:5000/api/report/revenue-overview/today
router.get("/revenue-overview/date", getPaymentRevenueByDate);

// GETTING SALES MONTHLY
// GET http://localhost:5000/api/report/sales/monthly
router.get("/sales/monthly", getSalesMonthly);

// GETTING SALES THIS MONTH
// GET http://localhost:5000/api/report/sales/monthly
router.get("/sales/this-month", getSalesThisMonth);

// GETTING SALES THIS WEEK
// GET http://localhost:5000/api/report/sales/this-week
router.get("/sales/this-week", getSalesThisWeek);

// GETTING SALES BY DATE
// GET http://localhost:5000/api/report/sales/date
router.get("/sales/date", getSalesByDate);

// GET POPULAR MENU THIS YEAR
// GET http://localhost:5000/api/report/popular/this-year
router.get("/popular/this-year", getPopularThisYear);

// GET POPULAR MENU THIS MONTH
router.get("/popular/this-month", getPopularThisMonth);

// GET POPULAR MENU THIS WEEK
// GET http://localhost:5000/api/report/popular/this-week
router.get("/popular/this-week", getPopularThisWeek);

// GET POPULAR MENU TODAY
// GET http://localhost:5000/api/report/popular/today
router.get("/popular/today", getPopularToday);

// GET POPULAR MENU BY DATE
// GET http://localhost:5000/api/report/popular/date
router.get("/popular/date", getPopularByDate);

// GET PROFIT LOSS
// GET http://localhost:5000/api/report/profit
router.get("/profit", getProfitLoss);

// GET NERACA
// GET http://localhost:5000/api/report/neraca
router.get("/neraca", getNeraca);

export default router;