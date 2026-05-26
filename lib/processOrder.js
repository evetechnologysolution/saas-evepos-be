import Order from "../models/pos/order.js";
import Member from "../models/member/member.js";
import MemberVoucher from "../models/member/voucherMember.js";
import Balance from "../models/cashBalance/cashBalance.js";
import BalanceHistory from "../models/cashBalance/cashBalanceHistory.js";
import { checkPoint, createPointHistory } from "./handlePoint.js";
import { sendOrderMail } from "./nodemailer.js";
import { pusherNotif } from "./pusher.js";

const processOrderAsync = async ({
    order,
    member,
    userData,
    objData,
}) => {
    try {
        // delay biar tidak blocking event loop
        setImmediate(async () => {

            // ================= VOUCHER =================
            if (objData.voucherCode?.length) {
                await MemberVoucher.updateMany(
                    {
                        voucherCode: { $in: objData.voucherCode },
                        isUsed: false,
                    },
                    {
                        $set: { isUsed: true, usedAt: new Date() },
                    }
                );
            }

            // ================= BALANCE =================
            if (objData.status === "paid" || objData.status === "refund") {
                const balance = await Balance.findOneAndUpdate(
                    {
                        isOpen: true,
                        tenantRef: userData?.tenantRef,
                        outletRef: objData?.outletRef,
                    },
                    { $setOnInsert: { isOpen: true } },
                    { upsert: true, new: true }
                );

                await BalanceHistory.create({
                    title: objData.status === "refund" ? "Refund" : "Sales",
                    isCashOut: objData.status === "refund",
                    amount: objData.billedAmount,
                    payment: objData.payment,
                    orderRef: order._id,
                    cashBalanceRef: balance._id,
                    tenantRef: balance.tenantRef,
                    outletRef: balance.outletRef,
                });
            }

            // ================= POINT SYSTEM =================
            if (member && objData.status === "paid") {
                const points = checkPoint(objData.billedAmount);

                await Member.updateOne(
                    { _id: member._id },
                    {
                        $inc: {
                            spendMoney: objData.billedAmount,
                            point: points,
                        },
                    }
                );

                if (points > 0) {
                    await createPointHistory(
                        member._id,
                        order._id,
                        userData?.tenantRef,
                        points,
                        "in"
                    );
                }
            }

            // ================= NOTIFICATION (NON BLOCKING) =================
            if (userData?.isEvewash && objData.orderType === "delivery") {
                const message =
                    objData?.customer?.name
                        ? `New Order from ${objData.customer.name}`
                        : "New Order!";

                Promise.allSettled([
                    sendOrderMail(order),
                    pusherNotif("admin-notif", "order-new", {
                        ...order,
                        message,
                    }),
                ]);
            }

        });

    } catch (err) {
        console.error("Async order processing error:", err);
    }
};

export { processOrderAsync };