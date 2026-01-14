import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { capitalizeFirstLetter } from "../lib/textSetting.js";

const oneMonthFromNow = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now;
};

const DataSchema = mongoose.Schema({
    expiry: {
        type: Date,
        default: oneMonthFromNow
    },
    scanDate: {
        type: Date
    },
    usedAt: {
        type: Date
    },
    voucherCode: {
        type: String
    },
    voucherRef: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Vouchers",
    },
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Members",
    },
    name: {
        type: String,
        set: capitalizeFirstLetter,
        trim: true,
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
    orderRef: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Orders",
    },
    isUsed: {
        type: Boolean,
        default: false
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

DataSchema.plugin(aggregatePaginate);

DataSchema.pre("save", function (next) {
    if (this.scanDate) {
        this.usedAt = this.scanDate;
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.scanDate) {
        update.$set.usedAt = update.$set.scanDate;
    }
    next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.scanDate) {
        update.$set.usedAt = update.$set.scanDate;
    }
    next();
});

export default mongoose.model("VoucherMembers", DataSchema);