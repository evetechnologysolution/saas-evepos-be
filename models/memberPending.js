import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter, convertToE164 } from "../lib/textSetting.js";

const DataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: false,
        unique: false
    },
    password: {
        type: String,
        required: false
    },
    province: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    district: {
        type: String,
        default: ""
    },
    subdistrict: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        required: false
    },
    addressNotes: {
        type: String,
        required: false
    },
    location: {
        placeId: String,
        lat: Number,
        lng: Number
    },
    otp: {
        type: String,
        required: false
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
}, { timestamps: true });

DataSchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeFirstLetter(this.name);
    }
    if (this.phone) {
        this.phone = convertToE164(this.phone);
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.name) {
        update.$set.name = capitalizeFirstLetter(update.$set.name);
    }
    if (update.$set && update.$set.phone) {
        update.$set.phone = convertToE164(update.$set.phone);
    }
    next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.name) {
        update.$set.name = capitalizeFirstLetter(update.$set.name);
    }
    if (update.$set && update.$set.phone) {
        update.$set.phone = convertToE164(update.$set.phone);
    }
    next();
});

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("MemberPendings", DataSchema);