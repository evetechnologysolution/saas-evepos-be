import mongoose from "mongoose";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        uppercase: true,
        trim: true,
        required: true
    },
    phone: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    province: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    region: {
        type: String,
        default: ""
    },
    zipCode: {
        type: String,
        default: ""
    },
    accountType: {
        type: String,
        lowercase: true,
        enum: ["basic", "start up", "enterprise"],
        default: "enterprise"
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

//'Informations' is the table thats gonna show up in Mongo DB
export default mongoose.model('Informations', DataSchema);