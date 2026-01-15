import mongoose from "mongoose";

const DataSchema = mongoose.Schema({
    cashBalance: {
        type: Boolean,
        default: true,
    },
    themeSetting: {
        type: Boolean,
        default: true,
    },
    dineIn: {
        table: {
            type: Boolean,
            default: true,
        },
        customer: {
            type: Boolean,
            default: true,
        },
    },
    deliveryBaseRate: {
        type: Number,
        default: 5000
    },
    deliveryRatePerMinute: {
        type: Number,
        default: 1000
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
    outletRef: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Outlets",
        }],
        default: []
    }
}, { timestamps: true });

DataSchema.index({ tenantRef: 1, outletRef: 1 });

export default mongoose.model("Settings", DataSchema);