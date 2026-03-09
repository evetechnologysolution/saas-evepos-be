import Subs from "../../models/core/subscription.js";
import { errorResponse } from "../../utils/errorResponse.js";
import { sendSubsReminderEmail } from "../../lib/nodemailer.js";

export const runSubscriptionReminder = async (req, res) => {
  try {
    // ===============================
    // AUTH CRON
    // ===============================
    if (
      process.env.CRON_SECRET &&
      req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ===============================
    // TODAY
    // ===============================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const addDays = (base, days) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    const startOfDay = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const endOfDay = (date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const H7 = addDays(today, 7);
    const H3 = addDays(today, 3);

    // ===============================
    // AMBIL DATA
    // ===============================
    const subs = await Subs.find({
      status: { $in: ["active", "trial"] },
      $or: [
        { endDate: { $gte: startOfDay(H7), $lte: endOfDay(H7) } },
        { endDate: { $gte: startOfDay(H3), $lte: endOfDay(H3) } },
      ],
    }).populate({
      path: "tenantRef",
      select: "email businessName ownerName",
    });

    // ===============================
    // HELPER
    // ===============================
    const getRemainingDays = (endDate) => {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      const diff = end - today;
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    };

    let totalSent = 0;
    let failed = 0;

    // ===============================
    // LOOP EMAIL
    // ===============================
    for (const sub of subs) {
      const tenant = sub.tenantRef;

      if (!tenant?.email) {
        failed++;
        continue;
      }

      const remainingDays = getRemainingDays(sub.endDate);

      const tenantName =
        tenant.businessName || tenant.ownerName || "Tenant EvePOS";

      try {
        await sendSubsReminderEmail({
          email: tenant.email,
          username: tenantName,
          endDate: formatDate(sub.endDate),
          remainingDays,
        });

        totalSent++;
      } catch (err) {
        failed++;
        console.error("Gagal kirim ke:", tenant.email, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Reminder subscription berhasil dijalankan",
      data: {
        totalTarget: subs.length,
        totalSent,
        failed,
      },
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      code: "SERVER_ERROR",
      message: err.message || "Terjadi kesalahan pada server",
    });
  }
};
