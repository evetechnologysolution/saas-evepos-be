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
        amount: {
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
            url: {
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
            enum: ["paid", "unpaid"],
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

DataSchema.index({ tenantRef: 1, subsRef: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Invoices", DataSchema);
