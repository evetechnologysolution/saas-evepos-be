import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import path from "path";
import logger from "morgan";
import "dotenv/config.js";
import dbConnect from "./utils/dbConnect.js";

process.env.TZ = "Asia/Jakarta";

const port = process.env.PORT || 7777;

const app = express();

// Tentukan __dirname secara manual karena di ES Modules tidak tersedia langsung
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// jika tidak menggunakan login by google
app.use(cors({ origin: "*" }));

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

// user master
import authUserMasterRoute from "./routes/userMaster/authUserMaster.route.js";
import userMasterRoute from "./routes/userMaster/userMaster.route.js";

// core
import serviceRoutes from "./routes/core/service.route.js";
import tenantRoute from "./routes/core/tenant.route.js";
import tenantLogRoute from "./routes/core/tenantLog.route.js";
import subscriptionRoutes from "./routes/core/subscription.route.js";
import authTenantRoute from "./routes/core/authTenant.route.js";
import authUserRoute from "./routes/user/authUser.route.js";
import surveyRoute from "./routes/core/survey.route.js";
import invoiceRoute from "./routes/core/invoice.route.js";

// setup
import setupRoute from "./routes/setup/setup.route.js";

// library
import categoryRoute from "./routes/library/category.route.js";
import subcategoryRoute from "./routes/library/subcategory.route.js";
import variantRoute from "./routes/library/variant.route.js";
import productRoute from "./routes/library/product.route.js";
import promotionRoute from "./routes/library/promotion.route.js";

// pos
import orderRoute from "./routes/pos/order.route.js";
import progressLabelRoute from "./routes/pos/progressLabel.route.js";
import progressRoute from "./routes/pos/progress.route.js";

// setting
import settingRoute from "./routes/setting/setting.route.js";
import receiptRoute from "./routes/setting/receipt.route.js";
import taxRoute from "./routes/setting/tax.route.js";
import cashBalanceRoute from "./routes/cashBalance/cashBalance.route.js";

// master
import userRoute from "./routes/user/user.route.js";
import memberRoute from "./routes/member/member.route.js";

// report
import revenueRoute from "./routes/report/revenue.route.js";
import salesOverviewRoute from "./routes/report/sales.route.js";
import popularRoute from "./routes/report/popular.route.js";
import paymentRevenueRoute from "./routes/report/paymentRevenue.route.js";
import auditTrailRoute from "./routes/audit/audit.route.js";

// import pusherRoute from "./routes/pusher.route.js";
// import informationRoute from "./routes/information.route.js";
// import promotionSpecialRoute from "./routes/promotionSpecial.route.js";
// import bannerRoute from "./routes/banner.route.js";
// import reportRoute from "./routes/report.route.js";
// import expenseRoute from "./routes/expense.route.js";
// import customerRoute from "./routes/customer.route.js";
// import pointHistoryRoute from "./routes/pointHistory.route.js";
// import gmapRoute from "./routes/gmap.route.js";
// import voucherUsedRoute from "./routes/voucherUsed.route.js";
// import paymentRoute from "./routes/payment.route.js";
// import cartRoute from "./routes/cart.route.js";
// import discountRoute from "./routes/discount.route.js";
// import voucherRoute from "./routes/voucher.route.js";
// import voucherMemberRoute from "./routes/voucherMember.route.js";
// import helpRoute from "./routes/help.route.js";
// import messageRoute from "./routes/message.route.js";

// cron
app.use("/api/cron", cronRoute); // disambungkan ke cron-job.org atau github actions

// user master
app.use("/api/auth-master", authUserMasterRoute);
app.use("/api/user-master", userMasterRoute);

// core
app.use("/api/service", serviceRoutes);
app.use("/api/tenant", tenantRoute);
app.use("/api/tenant-log", tenantLogRoute);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/auth-tenant", authTenantRoute);
app.use("/api/auth", authUserRoute);
app.use("/api/survey", surveyRoute);
app.use("/api/invoice", invoiceRoute);

// setup
app.use("/api/setup", setupRoute);

// library
app.use("/api/category", categoryRoute);
app.use("/api/subcategory", subcategoryRoute);
app.use("/api/variant", variantRoute);
app.use("/api/product", productRoute);
app.use("/api/promotion", promotionRoute);

// pos
app.use("/api/order", orderRoute);
app.use("/api/progress-label", progressLabelRoute);
app.use("/api/progress", progressRoute);

// setting
app.use("/api/setting", settingRoute);
app.use("/api/tax", taxRoute);
app.use("/api/receipt-setting", receiptRoute);
app.use("/api/cash-balance", cashBalanceRoute);

// master
app.use("/api/user", userRoute);
app.use("/api/member", memberRoute);

// report
app.use("/api/revenue", revenueRoute);
app.use("/api/sales-overview", salesOverviewRoute);
app.use("/api/popular", popularRoute);
app.use("/api/payment-revenue", paymentRevenueRoute);
app.use("/api/audit", auditTrailRoute);

// app.use("/api/pusher", pusherRoute);
// app.use("/api/informations", informationRoute);
// app.use("/api/special-promotions", promotionSpecialRoute);
// app.use("/api/banners", bannerRoute);
// app.use("/api/report", reportRoute);
// app.use("/api/expense", expenseRoute);
// app.use("/api/customers", customerRoute);
// app.use("/api/point-history", pointHistoryRoute);
// app.use("/api/gmap", gmapRoute);
// app.use("/api/voucher-used", voucherUsedRoute);
// app.use("/api/payment", paymentRoute);
// app.use("/api/cart", cartRoute);
// app.use("/api/discount", discountRoute);
// app.use("/api/vouchers", voucherRoute);
// app.use("/api/member-vouchers", voucherMemberRoute);
// app.use("/api/help", helpRoute);
// app.use("/api/messages", messageRoute);

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
