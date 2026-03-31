import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true
        },
        amount: {
            type: Number,
            default: 0
        },
        isCashOut: {
            type: Boolean,
            default: false
        },
        payment: {
            type: String,
            lowercase: true,
            trim: true,
            default: "cash"
        },
        orderRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Orders",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        cashBalanceRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CashBalances",
            required: true
        },
        tenantRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenants",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        outletRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Outlets",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
    },
    { timestamps: true },
);

DataSchema.index({ cashBalanceRef: 1, tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("CashBalanceHistories", DataSchema);
