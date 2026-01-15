import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const DataSchema = mongoose.Schema({
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Members",
    },
    orderRef: {
        type: String,
        default: "",
    },
    orderPending: {
        type: String,
        default: "",
    },
    point: {
        type: Number,
        default: 0,
    },
    pointRemaining: {
        type: Number,
        default: 0,
    },
    pointPendingUsed: {
        type: Number,
        default: 0,
    },
    pointExpiry: {
        type: Date,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        lowercase: true,
        enum: ["in", "out"],
        default: "out",
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
    outletRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlets",
        default: null,
    },
}, { timestamps: true });

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);
DataSchema.plugin(aggregatePaginate);

export default mongoose.model("pointHistories", DataSchema);