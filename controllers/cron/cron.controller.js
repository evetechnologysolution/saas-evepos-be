import Subs from "../../models/core/subscription.js";
import { errorResponse } from "../../utils/errorResponse.js";
import { sendSubsExpiredEmail } from "../../lib/nodemailer.js";

// GET A SPECIFIC DATA
// export const checkSubsStatus = async (req, res) => {
//     try {
//         const now = new Date();
//         now.setHours(0, 0, 0, 0);

//         const result = await Subs.updateMany(
//             {
//                 endDate: { $lt: now },
//                 status: { $nin: ["expired", "canceled", "pending"] },
//             },
//             {
//                 $set: { status: "expired" },
//             },
//         );

//         return res.status(200).json({
//             success: true,
//             message:
//                 result.modifiedCount > 0
//                     ? "Subscription berhasil di-update menjadi expired"
//                     : "Tidak ada subscription yang perlu di-update",
//             data: {
//                 matched: result.matchedCount,
//                 modified: result.modifiedCount,
//             },
//         });
//     } catch (err) {
//         return errorResponse(res, {
//             statusCode: 500,
//             code: "SERVER_ERROR",
//             message: err.message || "Terjadi kesalahan pada server",
//         });
//     }
// };
export const checkSubsStatus = async (req, res) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Ambil dulu yang akan expired
    const subsToExpire = await Subs.find({
      endDate: { $lt: now },
      status: { $nin: ["expired", "canceled", "pending"] },
    }).populate({
      path: "tenantRef",
      select: "email businessName ownerName",
    });

    // Update status
    const result = await Subs.updateMany(
      {
        endDate: { $lt: now },
        status: { $nin: ["expired", "canceled", "pending"] },
      },
      {
        $set: { status: "expired" },
      },
    );

    let totalEmailSent = 0;
    let failed = 0;

    // Kirim email
    for (const sub of subsToExpire) {
      const tenant = sub.tenantRef;

      if (!tenant?.email) {
        failed++;
        continue;
      }

      const tenantName =
        tenant.businessName || tenant.ownerName || "Tenant EvePOS";

      const endDate = new Date(sub.endDate).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      try {
        await sendSubsExpiredEmail({
          email: tenant.email,
          username: tenantName,
          endDate,
        });

        totalEmailSent++;
      } catch (err) {
        failed++;
        console.error("Gagal kirim email expired ke:", tenant.email);
      }
    }

    return res.status(200).json({
      success: true,
      message:
        result.modifiedCount > 0
          ? "Subscription berhasil di-update menjadi expired"
          : "Tidak ada subscription yang perlu di-update",
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        emailSent: totalEmailSent,
        emailFailed: failed,
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
