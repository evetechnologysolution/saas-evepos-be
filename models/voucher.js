import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
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
        type: [mongoose.Schema.Types.ObjectId],
        default: null,
        ref: "Products",
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
    },
    outletRef: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Outlets",
        }],
        default: []
    }
}, { timestamps: true });

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Vouchers", DataSchema);