import mongoose from "mongoose";

const DataSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        email: {
            type: String,
            trim: true,
            default: "",
        },
        web: {
            type: String,
            trim: true,
            default: "",
        },
        image: {
            type: String,
            trim: true,
            default: "",
        },
        imageId: {
            type: String,
            trim: true,
            default: "",
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        province: {
            type: String,
            trim: true,
            default: "",
        },
        city: {
            type: String,
            trim: true,
            default: "",
        },
        region: {
            type: String,
            trim: true,
            default: "",
        },
        zipCode: {
            type: String,
            trim: true,
            default: "",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        isPrintLogo: {
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

DataSchema.index({ tenantRef: 1, outletRef: 1 });

//"ReceiptHeaders" is the table thats gonna show up in Mongo DB
export default mongoose.model("ReceiptHeaders", DataSchema);
