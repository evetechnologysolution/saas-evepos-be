import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";

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
    image: {
        type: String
    },
    imageId: {
        type: String
    },
    type: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    validUntil: {
        type: Boolean,
        default: false
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

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(aggregatePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

//"Promotions" is the table thats gonna show up in Mongo DB
export default mongoose.model("Promotions", DataSchema);