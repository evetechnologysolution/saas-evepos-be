import Order from "../../models/pos/order.js";
import Message from "../../models/message/message.js";
import VoucherPostcard from "../../models/member/voucherMember.js";

export const getAllNotification = async (req, res) => {
    try {
        const tenantFilter = req.userData?.tenantRef ? { tenantRef: req.userData.tenantRef } : {};

        const [totalDelivery, totalUnreadMessage, totalNewPostcard] = await Promise.all([
            Order.countDocuments({
                status: "backlog",
                orderType: "delivery",
                ...tenantFilter,
            }),
            Message.countDocuments({
                isRead: false,
                isAdmin: false,
                ...tenantFilter,
            }),
            VoucherPostcard.countDocuments({
                voucherType: 3,
                isPrinted: { $ne: true },
                ...tenantFilter,
            }),
        ]);

        return res.status(200).json({
            backlogDelivery: totalDelivery,
            unreadMessage: totalUnreadMessage,
            newPostcard: totalNewPostcard,
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Internal server error",
        });
    }
};
