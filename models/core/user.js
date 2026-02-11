import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema(
    {
        userId: {
            type: String,
            trim: true,
            default: "",
        },
        username: {
            type: String,
            required: [true, "Username wajib diisi"],
            unique: true,
            trim: true,
        },
        fullname: {
            type: String,
            trim: true,
            default: "",
        },
        phone: {
            type: String,
            trim: true,
            default: "",
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
            trim: true,
            default: "",
        },
        address: { type: String, trim: true, default: "" },
        province: { type: String, uppercase: true, trim: true, default: "" },
        city: { type: String, uppercase: true, trim: true, default: "" },
        district: { type: String, uppercase: true, trim: true, default: "" },
        subdistrict: { type: String, uppercase: true, trim: true, default: "" },
        zipCode: { type: String, trim: true, default: "" },
        password: {
            type: String,
            required: true,
            minLength: 6,
        },
        image: {
            type: String,
            default: "",
            required: false,
        },
        imageId: {
            type: String,
            default: "",
            required: false,
        },
        ktp: {
            number: { type: String, trim: true, default: "" },
            image: { type: String, default: "" },
            imageId: { type: String, default: "" },
        },
        npwp: {
            number: { type: String, trim: true, default: "" },
            image: { type: String, default: "" },
            imageId: { type: String, default: "" },
        },
        role: {
            type: String,
            lowercase: true,
            trim: true,
            required: true,
            default: "admin",
        },
        resetToken: { type: String, default: "" },
        resetTokenExpiry: { type: Date },
        isActive: {
            type: Boolean,
            default: true,
        },
        tenantRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenants",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        outletRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Outlets",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
    },
    { timestamps: true },
);

DataSchema.pre("save", function (next) {
    if (!this.userId) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId();
        this.userId = `TU${currYear}${number}`;
    }
    next();
    if (this.fullname) {
        this.fullname = capitalizeFirstLetter(this.fullname);
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.fullname) {
        update.$set.fullname = capitalizeFirstLetter(update.$set.fullname);
    }
    next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.fullname) {
        update.$set.fullname = capitalizeFirstLetter(update.$set.fullname);
    }
    next();
});

DataSchema.index({ tenantRef: 1, outletRef: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Users", DataSchema);
