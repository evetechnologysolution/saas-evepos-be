import Order from "../../models/pos/order.js";
import Message from "../../models/message/message.js";
import VoucherPostcard from "../../models/member/voucherMember.js";

export const getAllNotification = async (req, res) => {
    try {
        const outletSource =
            req.body?.outletRef ??
            req.query?.outletRef ??
            req.userData?.outletRef;

        const outletFilter = outletSource ? { outletRef: outletSource } : {};
        const tenantFilter = req.userData?.tenantRef ? { tenantRef: req.userData.tenantRef } : {};
        const tenantTransfer = req.userData?.tenantRef ? { "transfer.toOutletRef": req.userData.tenantRef } : {};

        const [totalDelivery, totalUnreadMessage, totalNewPostcard, totalNewTransfer] = await Promise.all([
            Order.countDocuments({
                status: "backlog",
                orderType: "delivery",
                ...tenantFilter,
                ...outletFilter,
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
            Order.countDocuments({
                "transfer.status": "open",
                ...tenantTransfer,
                ...outletFilter,
            }),
        ]);

        return res.status(200).json({
            backlogDelivery: totalDelivery,
            unreadMessage: totalUnreadMessage,
            newPostcard: totalNewPostcard,
            newTransfer: totalNewTransfer,
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Internal server error",
        });
    }
};
