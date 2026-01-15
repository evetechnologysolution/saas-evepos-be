import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DataSchema = mongoose.Schema({
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Members",
    },
    phone: {
        type: String,
        trim: true,
        default: "",
    },
    voucher: {
        type: String,
        uppercase: true
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

export default mongoose.model("VoucherUsed", DataSchema);