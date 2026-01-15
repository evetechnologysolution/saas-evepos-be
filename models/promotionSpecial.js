import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { capitalizeFirstLetter } from "../lib/textSetting.js";

const DataSchema = mongoose.Schema({
    promotionId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    imageId: {
        type: String
    },
    amount: {
        type: Number,
        default: 0
    },
    qtyMin: {
        type: Number,
        default: 0
    },
    qtyFree: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: null,
    },
    endDate: {
        type: Date,
        default: null,
    },
    validUntil: {
        type: Boolean,
        default: false
    },
    selectedDay: {
        type: Number,
        required: true
    },
    products: {
        type: [mongoose.Types.ObjectId],
        default: []
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

DataSchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeFirstLetter(this.name);
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.name) {
        update.$set.name = capitalizeFirstLetter(update.$set.name);
    }
    next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.name) {
        update.$set.name = capitalizeFirstLetter(update.$set.name);
    }
    next();
});

DataSchema.plugin(aggregatePaginate);

//"Promotions" is the table thats gonna show up in Mongo DB
export default mongoose.model("PromotionSpecial", DataSchema);