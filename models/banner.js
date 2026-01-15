import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../lib/textSetting.js";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: ""
    },
    imageId: {
        type: String,
        default: ""
    },
    imageMobile: {
        type: String,
        default: ""
    },
    imageMobileId: {
        type: String,
        default: ""
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    listNumber: {
        type: Number,
        required: true
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
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Banners", DataSchema);