import mongoose from "mongoose";

const DataSchema = new mongoose.Schema({
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Members",
        required: true,
    },
    items: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
            },
            name: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                default: 0,
            },
            realPrice: {
                type: Number,
                default: 0,
            },
            productionPrice: {
                type: Number,
                default: 0,
            },
            qty: {
                type: Number,
                default: 0,
            },
            image: {
                type: String,
                required: false,
            },
            notes: {
                type: String,
                default: "",
            },
            category: {
                type: String,
                required: false,
            },
            unit: {
                type: String,
                lowercase: true,
                default: "pcs",
            },
            promotionType: {
                type: Number,
                default: 0
            },
            discountAmount: {
                type: Number,
                default: 0
            },
            discountLaundryBag: {
                type: Number,
                default: 0
            },
            variant: {
                type: [
                    {
                        name: {
                            type: String,
                            required: false,
                        },
                        option: {
                            type: String,
                            required: false,
                        },
                        price: {
                            type: Number,
                            default: 0,
                        },
                        productionPrice: {
                            type: Number,
                            default: 0,
                        },
                        qty: {
                            type: Number,
                            default: 1
                        },
                    },
                ],
                default: [],
            },
            amountKg: {
                type: Number,
                default: 0,
            },
            isLaundryBag: {
                type: Boolean,
                default: false
            }
        },
    ],
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

export default mongoose.model("Carts", DataSchema);