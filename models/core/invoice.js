import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema(
    {
        invoiceId: {
            type: String,
            trim: true,
            default: "",
        },
        tenantRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenants",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        subsRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscriptions",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        serviceRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Services",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        serviceName: {
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        subsType: {
            type: String,
            trim: true,
            enum: ["monthly", "yearly"],
            default: "monthly",
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        qty: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        adminFee: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        billedAmount: {
            type: Number,
            default: 0,
        },
        payment: {
            createdAt: {
                type: Date,
                default: Date.now,
            },
            paidAt: {
                type: Date,
                default: null,
            },
            channel: {
                type: String,
                trim: true,
                default: "",
            },
            invoiceUrl: {
                type: String,
                trim: true,
                default: "",
            },
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            lowercase: true,
            trim: true,
            enum: ["paid", "unpaid", "canceled"],
            default: "unpaid",
        },
    },
    { timestamps: true },
);

DataSchema.pre("save", async function (next) {
    if (!this.invoiceId) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId();
        this.invoiceId = `INV${currYear}${number}`;
    }
    next();
});

DataSchema.index({ tenantRef: 1, subsRef: 1, serviceRef: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Invoices", DataSchema);
