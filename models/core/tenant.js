import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema(
    {
        tenantId: {
            type: String,
            trim: true,
            default: "",
        },
        ownerName: {
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        businessName: {
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        businessType: {
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        legalStatus: {
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        operatingSince: {
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        imageId: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
        socialMedia: {
            type: [
                {
                    platform: String,
                    account: String,
                },
            ],
            default: [],
        },
        phone: {
            type: String,
            unique: true,
            trim: true,
            required: [true, "Phone wajib diisi"],
        },
        phone2: {
            type: String,
            trim: true,
            default: "",
        },
        phone3: {
            type: String,
            trim: true,
            default: "",
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
            enum: ["pending", "active", "inactive", "suspended"],
            default: "pending",
        },
    },
    { timestamps: true },
);

DataSchema.pre("save", async function (next) {
    if (!this.tenantId) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId();
        this.tenantId = `TN${currYear}${number}`;
    }
    next();
});

// virtual
DataSchema.virtual("subsRef", {
    ref: "Subscriptions",
    localField: "_id",
    foreignField: "tenantRef",
    justOne: true,
});

DataSchema.virtual("surveyRef", {
    ref: "Survey",
    localField: "_id",
    foreignField: "tenantRef",
    justOne: true,
});

// boolean helper
DataSchema.virtual("hasSurvey").get(function () {
    return !!this.surveyRef;
});

DataSchema.set("toJSON", { virtuals: true });
DataSchema.set("toObject", { virtuals: true });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

// the table thats gonna show up in Mongo DB
export default mongoose.model("Tenants", DataSchema);
