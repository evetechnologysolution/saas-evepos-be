import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema({
    tenantId: {
        type: String,
        trim: true,
        default: ""
    },
    ownerName: {
        type: String,
        uppercase: true,
        trim: true,
        default: ""
    },
    businessName: {
        type: String,
        uppercase: true,
        trim: true,
        default: ""
    },
    businessType: {
        type: String,
        uppercase: true,
        trim: true,
        default: ""
    },
    operatingSince: {
        type: String,
        uppercase: true,
        trim: true,
        default: ""
    },
    phone: {
        type: String,
        unique: true,
        trim: true,
        required: [true, "Phone wajib diisi"],
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: [true, "Email wajib diisi"],
        match: [/^\S+@\S+\.\S+$/, "Email tidak valid"],
    },
    address: { type: String, trim: true, default: "" },
    province: { type: String, uppercase: true, trim: true, default: "" },
    city: { type: String, uppercase: true, trim: true, default: "" },
    district: { type: String, uppercase: true, trim: true, default: "" },
    subdistrict: { type: String, uppercase: true, trim: true, default: "" },
    zipCode: { type: String, trim: true, default: "" },
    location: { placeId: String, lat: Number, lng: Number },
    status: {
        type: String,
        lowercase: true,
        trim: true,
        enum: ["pending", "active", "inactive"],
        default: "pending"
    },
}, { timestamps: true });

DataSchema.plugin(mongoosePaginate);

DataSchema.pre("save", async function (next) {
    if (!this.tenantId) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId();
        this.tenantId = `TN${currYear}${number}`;
    }
    next();
});

// the table thats gonna show up in Mongo DB
export default mongoose.model("Tenants", DataSchema);