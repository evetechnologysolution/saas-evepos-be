import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../lib/textSetting.js";

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
        enum: [1, 2], // 1 diskon, 2 hadiah
        default: 1
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
    // quota: {
    //     type: Number,
    //     default: 0
    // },
    worthPoint: {
        type: Number,
        default: 0
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
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Vouchers", DataSchema);