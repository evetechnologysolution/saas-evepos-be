import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = mongoose.Schema(
    {
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        cashIn: {
            type: Number,
            default: 0,
        },
        cashOut: {
            type: Number,
            default: 0,
        },
        sales: {
            type: Number,
            default: 0,
        },
        serviceCharge: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        refund: {
            type: Number,
            default: 0,
        },
        difference: {
            type: Number,
            default: 0,
        },
        detail: {
            cash: {
                type: Number,
                default: 0,
            },
            dana: {
                type: Number,
                default: 0,
            },
            shopeePay: {
                type: Number,
                default: 0,
            },
            ovo: {
                type: Number,
                default: 0,
            },
            qris: {
                type: Number,
                default: 0,
            },
            bri: {
                type: Number,
                default: 0,
            },
            bni: {
                type: Number,
                default: 0,
            },
            bca: {
                type: Number,
                default: 0,
            },
            mandiri: {
                type: Number,
                default: 0,
            },
            bankTransfer: {
                type: Number,
                default: 0,
            },
            onlinePayment: {
                type: Number,
                default: 0,
            },
        },
        history: {
            type: [
                {
                    date: {
                        type: Date,
                        default: Date.now,
                    },
                    title: String,
                    isCashOut: Boolean,
                    amount: Number,
                },
            ],
            default: [],
        },
        notes: {
            type: String,
            default: "",
        },
        isOpen: {
            type: Boolean,
            default: true,
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

DataSchema.virtual("total").get(function () {
    return (this.cashIn || 0) + (this.sales || 0) - (this.cashOut || 0);
});

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("CashBalances", DataSchema);
