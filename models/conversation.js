import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = new mongoose.Schema({
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Members",
        default: null,
        set: val => val === "" ? null : val
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages",
        default: null,
        set: val => val === "" ? null : val
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
        set: val => val === "" ? null : val
    },
    outletRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlets",
        default: null,
        set: val => val === "" ? null : val
    },
}, { timestamps: true });

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Conversations", DataSchema);
