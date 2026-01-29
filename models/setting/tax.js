import mongoose from "mongoose";

const DataSchema = mongoose.Schema(
    {
        tax: {
            isActive: {
                type: Boolean,
                default: true,
            },
            percentage: {
                type: Number,
                default: 0,
            },
            orderType: {
                type: [String],
                lowercase: true,
                enum: ["onsite", "delivery"],
                default: [],
            },
        },
        serviceCharge: {
            isActive: {
                type: Boolean,
                default: true,
            },
            percentage: {
                type: Number,
                default: 0,
            },
            orderType: {
                type: [String],
                lowercase: true,
                enum: ["onsite", "delivery"],
                default: [],
            },
        },
        tenantRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenants",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        outletRef: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Outlets",
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

DataSchema.index({ tenantRef: 1, outletRef: 1 });

export default mongoose.model("Taxs", DataSchema);
