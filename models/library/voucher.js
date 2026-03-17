import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";

const DataSchema = mongoose.Schema({
    start: {
        type: Date
    },
    end: {
        type: Date
    },
    name: {
        type: String,
        set: capitalizeFirstLetter,
        trim: true,
    },
    imageId: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    voucherType: {
        type: Number,
        enum: [1, 2, 3], // 1 diskon, 2 hadiah, 3 postcard
        default: 1
    },
    option: {
        type: String,
        trim: true,
        lowercase: true,
        default: ""
    },
    product: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Products",
        }],
        default: []
    },
    qtyProduct: {
        type: Number,
        default: 0
    },
    quota: {
        type: Number,
        default: 0
    },
    quotaUsed: {
        type: Number,
        default: 0
    },
    worthPoint: {
        type: Number,
        default: 0
    },
    isLimited: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
        set: val => val === "" ? null : val
    }
}, { timestamps: true });

DataSchema.virtual("quotaValidated", {
    ref: "VoucherMembers", // model tujuan
    localField: "_id", // field di schema ini
    foreignField: "voucherRef", // field di model tujuan
    count: true,
    match: { isUsed: true }
});

DataSchema.set("toJSON", { virtuals: true });
DataSchema.set("toObject", { virtuals: true });

DataSchema.index({ tenantRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Vouchers", DataSchema);