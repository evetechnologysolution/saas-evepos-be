import Subs from "../../models/core/subscription.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GET A SPECIFIC DATA
export const checkSubsStatus = async (req, res) => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const result = await Subs.updateMany(
            {
                endDate: { $lt: now },
                status: { $nin: ["expired", "canceled", "pending"] },
            },
            {
                $set: { status: "expired" },
            },
        );

        return res.status(200).json({
            success: true,
            message:
                result.modifiedCount > 0
                    ? "Subscription berhasil di-update menjadi expired"
                    : "Tidak ada subscription yang perlu di-update",
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount,
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
