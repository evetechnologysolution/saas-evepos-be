import mongoose from "mongoose";
import Invoice from "../../models/core/invoice.js";
import Subs from "../../models/core/subscription.js";
import { generatePayment } from "../../lib/xendit.js";

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
        const check = await Invoice.findOne({ _id: req.params.id })
            .populate([
                {
                    path: "tenantRef",
                    select: "ownerName businessName phone email status",
                },
            ])
            .lean();

        if (!check) {
            return res.status(400).json({ message: "Data not found." });
        }

        const xendit = await generatePayment({
            _id: check._id,
            baseUrl: req?.body?.baseUrl || "",
            customer: {
                name: check?.tenantRef?.ownerName || "",
                email: check?.tenantRef?.email || "",
                phone: check?.tenantRef?.phone || "",
            },
            totalPrice: check.billedAmount,
        });

        if (xendit.status !== 200) {
            return res.status(400).json({ message: "Generate payment failed." });
        }

        await Invoice.updateOne(
            { _id: check._id },
            {
                $set: {
                    payment: {
                        createdAt: new Date(),
                        invoiceUrl: xendit.invoiceUrl,
                    },
                },
            },
        );

        return res.json(xendit);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const callbackSuccessPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const validStatuses = ["PAID", "SETTLED"];

        if (!validStatuses.includes(req.body.status)) {
            await session.abortTransaction();
            return res.status(200).json({ message: "Payment expired!" });
        }

        const invoice = await Invoice.findById(req.body.external_id).session(session);

        if (!invoice) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Data not found" });
        }

        // Jika sudah paid, tidak perlu update lagi
        if (invoice.status !== "unpaid") {
            await session.commitTransaction();
            return res.json(invoice);
        }

        const updateInvoicePromise = Invoice.findByIdAndUpdate(
            invoice._id,
            {
                $set: {
                    status: "paid",
                    "payment.paidAt": new Date(),
                },
            },
            { new: true, session },
        );

        const updateSubsPromise = Subs.findByIdAndUpdate(
            invoice.subsRef,
            {
                $set: {
                    subsType: invoice.subsType,
                    startDate: invoice.startDate,
                    endDate: invoice.endDate,
                    status: "active",
                },
            },
            { session },
        );

        const [updatedInvoice] = await Promise.all([updateInvoicePromise, updateSubsPromise]);

        await session.commitTransaction();
        return res.json(updatedInvoice);
    } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

export const successPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invoice = await Invoice.findById(req.params.id).session(session);

        if (!invoice) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Data not found" });
        }

        // Jika sudah paid, tidak perlu update lagi
        if (invoice.status !== "unpaid") {
            await session.commitTransaction();
            return res.json(invoice);
        }

        const updateInvoicePromise = Invoice.findByIdAndUpdate(
            invoice._id,
            {
                $set: {
                    status: "paid",
                    "payment.paidAt": new Date(),
                },
            },
            { new: true, session },
        );

        const updateSubsPromise = Subs.findByIdAndUpdate(
            invoice.subsRef,
            {
                $set: {
                    subsType: invoice.subsType,
                    startDate: invoice.startDate,
                    endDate: invoice.endDate,
                    status: "active",
                },
            },
            { session },
        );

        const [updatedInvoice] = await Promise.all([updateInvoicePromise, updateSubsPromise]);

        await session.commitTransaction();
        return res.json(updatedInvoice);
    } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

export const failedPayment = async (req, res) => {
    try {
        const check = await Invoice.findOne({ _id: req.params.id }).lean();

        if (!check) {
            return res.status(200).json({ message: "Data not found" });
        }

        return res.json(check);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
