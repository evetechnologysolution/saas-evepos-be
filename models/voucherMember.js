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
        ref: "Vouchers",
        default: null,
        set: val => val === "" ? null : val
    },
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Members",
        default: null,
        set: val => val === "" ? null : val
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
    orderRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders",
        default: null,
        set: val => val === "" ? null : val
    },
    isUsed: {
        type: Boolean,
        default: false
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

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(aggregatePaginate);

export default mongoose.model("VoucherMembers", DataSchema);