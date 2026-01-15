import mongoose from "mongoose";

const DataSchema = mongoose.Schema({
    tax: {
        isActive: {
            type: Boolean,
            default: true
        },
        percentage: {
            type: Number,
            default: 0
        },
        orderType: {
            type: [String],
            lowercase: true,
            enum: ["onsite", "delivery"]
        },
    },
    serviceCharge: {
        isActive: {
            type: Boolean,
            default: true
        },
        percentage: {
            type: Number,
            default: 0
        },
        orderType: {
            type: [String],
            lowercase: true,
            enum: ["onsite", "delivery"]
        },
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

DataSchema.index({ tenantRef: 1, outletRef: 1 });

//'Orders' is the table thats gonna show up in Mongo DB
export default mongoose.model('taxs', DataSchema);