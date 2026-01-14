// import crypto from "crypto";
import Order from "../models/order.js";
import Balance from "../models/cashBalance.js";
import Member from "../models/member.js";
import { generatePayment } from "../lib/xendit.js";
import { generatePaymentMidtrans, deletePaymentMidtrans } from "../lib/midtrans.js";
import { checkPoint, adjustPointHistories, createPointHistory } from "../lib/handlePoint.js";

// function generateSHA512(order_id, status_code, gross_amount) {
//     const serverkey = process.env.MIDTRANS_KEY.replace("Basic ", "");
//     const data = order_id + status_code + gross_amount + serverkey;

//     // Generate SHA512 hash
//     const hash = crypto.createHash("sha512").update(data).digest("hex");

//     return hash;
// }

export const createPaymentMidtrans = async (req, res) => {
    try {
        if (req.body._id) {
            const check = await Order.findOne({ _id: req.body._id });
            if (check.invoiceUrl) {
                await deletePaymentMidtrans({ order_id: check._id });
            }
        }

        const midtrans = await generatePaymentMidtrans(req.body);

        return res.json(midtrans);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const recreatePaymentMidtrans = async (req, res) => {
    try {
        const check = await Order.findOne({ _id: req.params.id });

        if (!check) {
            return res.status(400).json({ message: "Data not found." });
        }

        if (check.invoiceUrl) {
            await deletePaymentMidtrans({ order_id: check._id });
        }

        const midtrans = await generatePaymentMidtrans({
            _id: check._id,
            baseUrl: req?.body?.baseUrl || "",
            customer: check.customer,
            totalPrice: check.billedAmount
        });

        if (midtrans.status !== 200) {
            return res.status(400).json({ message: "Generate payment failed." });
        }

        await Order.updateOne(
            { _id: check._id },
            {
                $set: {
                    invoiceUrl: midtrans.invoiceUrl
                }
            }
        );

        return res.json(midtrans);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const callbackSuccessPaymentMidtrans = async (req, res) => {
    try {

        const validStatuses = ["capture", "settlement"];

        if (!validStatuses.includes(req.body.transaction_status)) {
            return res.status(200).json({ message: "Payment expired!" });
        }

        const originalOrderId = req.body.order_id.split("-").slice(0, -1).join("-");

        const check = await Order.findOne({ _id: originalOrderId });

        if (!check) {
            return res.status(200).json({ message: "Data not found" });
        }

        // const sha512Hash = generateSHA512(originalOrderId, req.body.status_code, req.body.gross_amount);

        // if (sha512Hash !== req.body.signature_key) {
        //     return res.status(200).json({ message: "Signature not match." });
        // }

        let checkMember = null;
        if (check.customer.memberId) {
            checkMember = await Member.findOne({ memberId: check.customer.memberId });
        }

        if (check.status === "backlog" || check.status === "pending") {
            let statusOrder = "paid";
            if (check.status === "pending") {
                statusOrder = "pending";
            }
            const updatedData = await Order.findOneAndUpdate(
                { _id: check._id },
                {
                    $set: {
                        havePaid: statusOrder === "paid" ? check.billedAmount : 0,
                        status: statusOrder,
                        payment: check.payment !== "Online Payment" ? check.payment : "Online Payment"
                    }
                },
                { new: true } // Mengembalikan data yang diperbarui
            );

            if (updatedData.status && updatedData.billedAmount) {
                const statusPay = ["paid", "refund"];

                if (statusPay.includes(updatedData.status)) {
                    let increase = {
                        sales: updatedData.billedAmount
                    }

                    if (updatedData.payment === "Online Payment") {
                        increase = {
                            ...increase,
                            "detail.onlinePayment": updatedData.billedAmount
                        }
                    }

                    await Balance.findOneAndUpdate(
                        { isOpen: true },
                        { $inc: increase },
                        { new: true, upsert: false }
                    );
                }

                if (checkMember) {
                    if (updatedData.status === "paid") {
                        const pointsIncrement = checkPoint(updatedData.billedAmount);

                        const updatedMember = await Member.findOneAndUpdate(
                            { _id: checkMember._id },
                            {
                                $inc: {
                                    spendMoney: updatedData.billedAmount,
                                    point: pointsIncrement
                                }
                            },
                            { new: true } // Opsi new: true untuk mendapatkan dokumen yang diperbarui
                        );

                        if (updatedMember.spendMoney >= 80000000) {
                            let level = "silver";
                            if (updatedMember.spendMoney >= 200000000) {
                                level = "gold";
                            }
                            await Member.findOneAndUpdate(
                                { _id: checkMember._id },
                                {
                                    $set: {
                                        memberLevel: level,
                                    }
                                }
                            );
                        }

                        // update member point
                        if (updatedData.usedPoint) {
                            await adjustPointHistories(checkMember._id, updatedData.usedPoint, newData._id, "reduce");
                        }

                        // create point history
                        if (pointsIncrement > 0) {
                            await createPointHistory(checkMember._id, check._id, pointsIncrement, "in");
                        }
                    }

                    if (updatedData.usedPoint) {
                        await Member.findOneAndUpdate(
                            { _id: checkMember._id },
                            {
                                $inc: { point: -Number(updatedData.point) },
                            }
                        );
                        await createPointHistory(checkMember._id, check._id, updatedData.usedPoint, "out");
                    }
                }
            }

            return res.json(updatedData);
        }

        return res.json(check);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const createPayment = async (req, res) => {
    try {
        const xendit = await generatePayment(req.body);

        return res.json(xendit);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const recreatePayment = async (req, res) => {
    try {
        const check = await Order.findOne({ _id: req.params.id });

        if (!check) {
            return res.status(400).json({ message: "Data not found." });
        }

        const xendit = await generatePayment({
            _id: check._id,
            baseUrl: req?.body?.baseUrl || "",
            customer: check.customer,
            totalPrice: check.billedAmount
        });

        if (xendit.status !== 200) {
            return res.status(400).json({ message: "Generate payment failed." });
        }

        await Order.updateOne(
            { _id: check._id },
            {
                $set: {
                    invoiceUrl: xendit.invoiceUrl
                }
            }
        );

        return res.json(xendit);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const callbackSuccessPayment = async (req, res) => {
    try {
        const validStatuses = ["PAID", "SETTLED"];

        if (!validStatuses.includes(req.body.status)) {
            return res.status(200).json({ message: "Payment expired!" });
        }

        const check = await Order.findOne({ _id: req.body.external_id });

        if (!check) {
            return res.status(200).json({ message: "Data not found" });
        }

        let checkMember = null;
        if (check.customer.memberId) {
            checkMember = await Member.findOne({ memberId: check.customer.memberId });
        }

        if (check.status === "backlog" || check.status === "pending") {
            let statusOrder = "paid";
            if (check.status === "pending") {
                statusOrder = "pending";
            }
            const updatedData = await Order.findOneAndUpdate(
                { _id: check._id },
                {
                    $set: {
                        havePaid: statusOrder === "paid" ? check.billedAmount : 0,
                        status: statusOrder,
                        payment: check.payment !== "Online Payment" ? check.payment : "Online Payment"
                    }
                },
                { new: true } // Mengembalikan data yang diperbarui
            );

            if (updatedData.status && updatedData.billedAmount) {
                const statusPay = ["paid", "refund"];

                if (statusPay.includes(updatedData.status)) {
                    let increase = {
                        sales: updatedData.billedAmount
                    }

                    if (updatedData.payment === "Online Payment") {
                        increase = {
                            ...increase,
                            "detail.onlinePayment": updatedData.billedAmount
                        }
                    }

                    await Balance.findOneAndUpdate(
                        { isOpen: true },
                        { $inc: increase },
                        { new: true, upsert: false }
                    );
                }

                if (checkMember) {
                    if (updatedData.status === "paid") {
                        const pointsIncrement = checkPoint(updatedData.billedAmount);

                        const updatedMember = await Member.findOneAndUpdate(
                            { _id: checkMember._id },
                            {
                                $inc: {
                                    spendMoney: updatedData.billedAmount,
                                    point: pointsIncrement
                                }
                            },
                            { new: true } // Opsi new: true untuk mendapatkan dokumen yang diperbarui
                        );

                        if (updatedMember.spendMoney >= 80000000) {
                            let level = "silver";
                            if (updatedMember.spendMoney >= 200000000) {
                                level = "gold";
                            }
                            await Member.findOneAndUpdate(
                                { _id: checkMember._id },
                                {
                                    $set: {
                                        memberLevel: level,
                                    }
                                }
                            );
                        }

                        // update member point
                        if (updatedData.usedPoint) {
                            await adjustPointHistories(checkMember._id, updatedData.usedPoint, newData._id, "reduce");
                        }

                        // create point history
                        if (pointsIncrement > 0) {
                            await createPointHistory(checkMember._id, check._id, pointsIncrement, "in");
                        }
                    }

                    if (updatedData.usedPoint) {
                        await Member.findOneAndUpdate(
                            { _id: checkMember._id },
                            {
                                $inc: { point: -Number(updatedData.point) },
                            }
                        );
                        await createPointHistory(checkMember._id, check._id, updatedData.usedPoint, "out");
                    }
                }
            }

            return res.json(updatedData);
        }

        return res.json(check);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const successPayment = async (req, res) => {
    try {
        const check = await Order.findOne({ _id: req.params.id });

        if (!check) {
            return res.status(200).json({ message: "Data not found" });
        }

        let checkMember = null;
        if (check.customer.memberId) {
            checkMember = await Member.findOne({ memberId: check.customer.memberId });
        }

        if (check.status === "backlog" || check.status === "pending") {
            let statusOrder = "paid";
            if (check.status === "pending") {
                statusOrder = "pending";
            }
            const updatedData = await Order.findOneAndUpdate(
                { _id: check._id },
                {
                    $set: {
                        havePaid: statusOrder === "paid" ? check.billedAmount : 0,
                        status: statusOrder,
                        payment: check.payment !== "Online Payment" ? check.payment : "Online Payment"
                    }
                },
                { new: true } // Mengembalikan data yang diperbarui
            );

            if (updatedData.status && updatedData.billedAmount) {
                const statusPay = ["paid", "refund"];

                if (statusPay.includes(updatedData.status)) {
                    let increase = {
                        sales: updatedData.billedAmount
                    }

                    if (updatedData.payment === "Online Payment") {
                        increase = {
                            ...increase,
                            "detail.onlinePayment": updatedData.billedAmount
                        }
                    }

                    await Balance.findOneAndUpdate(
                        { isOpen: true },
                        { $inc: increase },
                        { new: true, upsert: false }
                    );
                }

                if (checkMember) {
                    if (updatedData.status === "paid") {
                        const pointsIncrement = checkPoint(updatedData.billedAmount);

                        const updatedMember = await Member.findOneAndUpdate(
                            { _id: checkMember._id },
                            {
                                $inc: {
                                    spendMoney: updatedData.billedAmount,
                                    point: pointsIncrement
                                }
                            },
                            { new: true } // Opsi new: true untuk mendapatkan dokumen yang diperbarui
                        );

                        if (updatedMember.spendMoney >= 80000000) {
                            let level = "silver";
                            if (updatedMember.spendMoney >= 200000000) {
                                level = "gold";
                            }
                            await Member.findOneAndUpdate(
                                { _id: checkMember._id },
                                {
                                    $set: {
                                        memberLevel: level,
                                    }
                                }
                            );
                        }

                        // update member point
                        if (updatedData.usedPoint) {
                            await adjustPointHistories(checkMember._id, updatedData.usedPoint, newData._id, "reduce");
                        }

                        // create point history
                        if (pointsIncrement > 0) {
                            await createPointHistory(checkMember._id, check._id, pointsIncrement, "in");
                        }
                    }

                    if (updatedData.usedPoint) {
                        await Member.findOneAndUpdate(
                            { _id: checkMember._id },
                            {
                                $inc: { point: -Number(updatedData.point) },
                            }
                        );
                        await createPointHistory(checkMember._id, check._id, updatedData.usedPoint, "out");
                    }
                }
            }

            return res.json(updatedData);
        }

        return res.json(check);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const failedPayment = async (req, res) => {
    try {
        const check = await Order.findOne({ _id: req.params.id });

        if (!check) {
            return res.status(200).json({ message: "Data not found" });
        }

        return res.json(check);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};