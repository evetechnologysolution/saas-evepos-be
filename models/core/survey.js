import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = mongoose.Schema({
    hasOnlineBusiness: {
        type: Boolean,
        required: true,
        default: false,
    },
    hasUsed: {
        type: Boolean,
        required: true,
        default: false,
    },
    hasUsedOtherApp: {
        type: Boolean,
        required: true,
        default: false,
    },
    otherAppName: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
    },
    productType: {
        type: [{
            type: String,
            lowercase: true,
            enum: ["tunggal", "kombinasi"],
        }],
        default: [],
    },
    requiredFeatures: {
        type: [{
            type: String,
            lowercase: true,
            // enum: ["akunting", "pencatatan transaksi", "manajemen stok"],
        }],
        default: [],
    },
    source: {
        type: String,
        // enum: ["google", "rekan", "lainnya"],
        required: true,
        lowercase: true,
        trim: true,
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
}, { timestamps: true });

DataSchema.index({ tenantRef: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Survey", DataSchema);