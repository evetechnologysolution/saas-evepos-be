import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import path from "path";
import logger from "morgan";
import MongoStore from "connect-mongo";
import session from "express-session";
import passport from "passport";
import "dotenv/config.js";
import dbConnect from "./utils/dbConnect.js";
import "./lib/passport.js";

process.env.TZ = "Asia/Jakarta";

const port = process.env.PORT || 7777;

const app = express();

// Tentukan __dirname secara manual karena di ES Modules tidak tersedia langsung
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Aktifkan CORS ketat hanya di production
const isProduction = process.env.NODE_ENV === "production";

// Middlewares
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3060",
    "https://evewash-cms.vercel.app",
    "https://evewash-cms-dev.vercel.app",
    "https://evewash-dev.vercel.app",
    "https://evewash-staging.vercel.app",
    "https://evewash-saas.vercel.app",
    "https://evewash.vercel.app",
    "https://evewash-pos-dev.vercel.app",
    "https://evewash-pos-staging.vercel.app",
    "https://evewash-pos.vercel.app",
    "https://evewash.com",
    "https://evewash-pos.com",
    "https://cms.evewash.com",
    "https://saas-evepos.vercel.app",
    "https://evepos-saas-dev.vercel.app",
    "https://evepos-saas.vercel.app",
    "https://evepos-office-dev.vercel.app",
    "https://evepos-office.vercel.app",
    "https://api.xendit.co",
    "https://api.sandbox.midtrans.com",
    "https://api.midtrans.com",
];

if (isProduction) {
    // jika menggunakan login by google
    app.use(
        cors({
            origin: (origin, callback) => {
                // Izinkan akses jika origin ada di daftar yang diizinkan atau tidak ada origin (permintaan server)
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    // Kembalikan error jika origin tidak diizinkan
                    callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
                }
            },
            methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
            credentials: true, // Pastikan aplikasi memang membutuhkan opsi ini
        }),
    );
} else {
    // jika tidak menggunakan login by google
    app.use(cors({ origin: "*" }));
}

// Error handling middleware untuk menangani error CORS
app.use((err, req, res, next) => {
    if (err instanceof Error && err.message.includes("CORS")) {
        return res.status(403).json({ error: err.message });
    }
    next(err); // Lanjutkan ke middleware error lainnya jika bukan error CORS
});

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(logger("dev"));

app.set("trust proxy", 1);

// Passport
app.use(
    session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.DB_CONNECTION, // URL MongoDB (dari MongoDB Atlas atau lokal)
            collectionName: "sessions", // Nama koleksi tempat session disimpan
            autoRemove: "native",
            // ttl: 14 * 24 * 60 * 60, // Durasi session (14 hari dalam detik)
        }),
        cookie: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            httpOnly: true,
        },
    }),
);
app.use(passport.initialize());
app.use(passport.session());

// koneksi database tiap request, hanya 1x per instance
app.use(async (req, res, next) => {
    try {
        await dbConnect();
        next();
    } catch (err) {
        console.error("❌ DB Connect failed:", err.message);
        res.status(500).json({ error: "Database connection failed" });
    }
});

// ROUTES
// cron
import cronRoute from "./routes/cron/cron.route.js"; // disambungkan ke cron-job.org atau github actions

// notification
import notifRoute from "./routes/notification/notification.route.js";

// user master
import authUserMasterRoute from "./routes/userMaster/authUserMaster.route.js";
import userMasterRoute from "./routes/userMaster/userMaster.route.js";

// core
import authUserRoute from "./routes/user/authUser.route.js";
import serviceRoutes from "./routes/core/service.route.js";
import tenantRoute from "./routes/core/tenant.route.js";
import tenantLogRoute from "./routes/core/tenantLog.route.js";
import tenantBankRoute from "./routes/core/tenantBank.route.js";
import subscriptionRoutes from "./routes/core/subscription.route.js";
import authTenantRoute from "./routes/core/authTenant.route.js";
import surveyRoute from "./routes/core/survey.route.js";
import invoiceRoute from "./routes/core/invoice.route.js";
import outletRoute from "./routes/core/outlet.route.js";

// setup
import setupRoute from "./routes/setup/setup.route.js";

// library
import categoryRoute from "./routes/library/category.route.js";
import subcategoryRoute from "./routes/library/subcategory.route.js";
import variantRoute from "./routes/library/variant.route.js";
import productRoute from "./routes/library/product.route.js";
import promotionRoute from "./routes/library/promotion.route.js";
import voucherRoute from "./routes/library/voucher.route.js";

// pos
import orderRoute from "./routes/pos/order.route.js";
import progressLabelRoute from "./routes/pos/progressLabel.route.js";
import progressRoute from "./routes/pos/progress.route.js";

// setting
import settingRoute from "./routes/setting/setting.route.js";
import receiptRoute from "./routes/setting/receipt.route.js";
import taxRoute from "./routes/setting/tax.route.js";
import cashBalanceRoute from "./routes/cashBalance/cashBalance.route.js";
import cashBalanceHistoryRoute from "./routes/cashBalance/cashBalanceHistory.route.js";

// master
import userRoute from "./routes/user/user.route.js";

// member
import authMemberRoute from "./routes/member/authMember.route.js";
import memberRoute from "./routes/member/member.route.js";

// report
import revenueRoute from "./routes/report/revenue.route.js";
import salesOverviewRoute from "./routes/report/sales.route.js";
import popularRoute from "./routes/report/popular.route.js";
import paymentRevenueRoute from "./routes/report/paymentRevenue.route.js";
import profitLossRoute from "./routes/report/profitLoss.route.js";

import auditTrailRoute from "./routes/audit/audit.route.js";
import paymentRoute from "./routes/payment/payment.route.js";
import ticketRoute from "./routes/ticket/ticket.route.js";
import pointHistoryRoute from "./routes/point/pointHistory.route.js";
import voucherMemberRoute from "./routes/member/voucherMember.route.js";
import expenseRoute from "./routes/expense/expense.route.js";

// cart
import cartRoute from "./routes/cart/cart.route.js";

// gmap
import gmapRoute from "./routes/gmap/gmap.route.js";

// banner
import bannerRoute from "./routes/banner/banner.route.js";

// global discount
import discountRoute from "./routes/globalDiscount/discount.route.js";

// help
import helpRoute from "./routes/help.route.js";

// message
import messageRoute from "./routes/message/message.route.js";

// pusher
import pusherRoute from "./routes/pusher.route.js";

// blog
import blogRoute from "./routes/article/article.route.js";
import galleryRoute from "./routes/article/gallery.route.js";

// cron
app.use("/api/cron", cronRoute); // disambungkan ke cron-job.org atau github actions

// notification
app.use("/api/notification", notifRoute);

// user master
app.use("/api/auth-master", authUserMasterRoute);
app.use("/api/user-master", userMasterRoute);

// core
app.use("/api/service", serviceRoutes);
app.use("/api/tenant", tenantRoute);
app.use("/api/tenant-log", tenantLogRoute);
app.use("/api/tenant-bank", tenantBankRoute);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/auth-tenant", authTenantRoute);
app.use("/api/auth", authUserRoute);
app.use("/api/survey", surveyRoute);
app.use("/api/invoice", invoiceRoute);
app.use("/api/outlet", outletRoute);
app.use("/api/payment", paymentRoute);

// setup
app.use("/api/setup", setupRoute);

// library
app.use("/api/category", categoryRoute);
app.use("/api/subcategory", subcategoryRoute);
app.use("/api/variant", variantRoute);
app.use("/api/product", productRoute);
app.use("/api/promotion", promotionRoute);
app.use("/api/voucher", voucherRoute);

// pos
app.use("/api/order", orderRoute);
app.use("/api/progress-label", progressLabelRoute);
app.use("/api/progress", progressRoute);

// setting
app.use("/api/setting", settingRoute);
app.use("/api/tax", taxRoute);
app.use("/api/receipt-setting", receiptRoute);
app.use("/api/cash-balance", cashBalanceRoute);
app.use("/api/cash-balance-history", cashBalanceHistoryRoute);

// master
app.use("/api/user", userRoute);

// member
app.use("/api/auth-member", authMemberRoute);
app.use("/api/member", memberRoute);

// point
app.use("/api/point-history", pointHistoryRoute);

// voucher
app.use("/api/member-voucher", voucherMemberRoute);

// report
app.use("/api/revenue", revenueRoute);
app.use("/api/sales-overview", salesOverviewRoute);
app.use("/api/popular", popularRoute);
app.use("/api/payment-revenue", paymentRevenueRoute);
app.use("/api/profit-loss", profitLossRoute);

app.use("/api/audit", auditTrailRoute);
app.use("/api/ticket", ticketRoute);

app.use("/api/expense", expenseRoute);

// cart
app.use("/api/cart", cartRoute);

// banner
app.use("/api/banner", bannerRoute);

// gmap
app.use("/api/gmap", gmapRoute);

// global discount
app.use("/api/discount", discountRoute);

// help
app.use("/api/help", helpRoute);

// message
app.use("/api/message", messageRoute);

// pusher
app.use("/api/pusher", pusherRoute);

// blog
app.use("/api/blog", blogRoute);
app.use("/api/gallery", galleryRoute);

app.get("/", (_, res) => {
    res.send("We are on home");
});

app.get("/healthz", (_, res) => {
    res.status(200).send("Ok");
});

// === HANYA LISTEN DI LOCAL ===
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`🚀 Server running locally on http://localhost:${port}`);
    });
} else {
    console.log("🟢 Running in server");
}

export default app;
export const handler = serverless(app);
