import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DataSchema = mongoose.Schema({
    hasOnlineBusiness: {
        type: Boolean,
        required: true,
        default: false,
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
    hasUsed: {
        type: Boolean,
        required: true,
        default: false,
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

export default mongoose.model("Survey", DataSchema);