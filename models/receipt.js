import mongoose from "mongoose";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    web: {
        type: String
    },
    image: {
        type: String
    },
    imageId: {
        type: String
    },
    address: {
        type: String
    },
    province: {
        type: String
    },
    city: {
        type: String
    },
    region: {
        type: String
    },
    zipCode: {
        type: String
    },
    notes: {
        type: String
    },
    isPrintLogo: {
        type: Boolean,
        default: true
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

DataSchema.index({ tenantRef: 1, outletRef: 1 });

//"ReceiptHeaders" is the table thats gonna show up in Mongo DB
export default mongoose.model("ReceiptHeaders", DataSchema);