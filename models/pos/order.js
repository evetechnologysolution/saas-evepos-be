import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter, convertToE164 } from "../../lib/textSetting.js";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema(
    {
        orderId: {
            type: String,
        },
        paymentDate: {
            type: Date,
        },
        pickupDateTime: {
            type: Date,
        },
        deliveryDate: {
            type: Date,
        },
        staff: {
            type: String,
        },
        customer: {
            memberId: String,
            cardId: String,
            name: String,
            phone: String,
            email: String,
            province: String,
            city: String,
            district: String,
            subdistrict: String,
            address: String,
            addressNotes: String,
            location: {
                placeId: String,
                lat: Number,
                lng: Number,
            },
            notes: String,
        },
        orders: [
            {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                name: {
                    type: String,
                    default: "",
                },
                image: {
                    type: String,
                    default: "",
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
                    default: 0,
                },
                splitQty: {
                    type: Number,
                    default: 0,
                },
                refundQty: {
                    type: Number,
                    default: 0,
                },
                category: {
                    type: String,
                    default: "",
                },
                unit: {
                    type: String,
                    lowercase: true,
                    default: "pcs",
                },
                promotionType: {
                    type: Number,
                    default: 0,
                },
                promotionQtyMin: {
                    type: Number,
                    default: 0,
                },
                discountAmount: {
                    type: Number,
                    default: 0,
                },
                isDailyPromotion: {
                    type: Boolean,
                    default: false,
                },
                variant: {
                    type: [
                        {
                            name: {
                                type: String,
                            },
                            option: {
                                type: String,
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
                                default: 1,
                            },
                        },
                    ],
                    default: [],
                },
                notes: {
                    type: String,
                    default: "",
                },
                isPickedUp: {
                    type: Boolean,
                    default: false,
                },
                pickupData: {
                    date: { type: Date, default: null },
                    by: { type: String, default: "" },
                },
            },
        ],
        orderType: {
            type: String,
            default: "onsite",
            enum: ["onsite", "delivery"],
            lowercase: true,
        },
        status: {
            type: String,
            default: "unpaid",
            enum: [
                "backlog",
                "awaiting payment",
                "unpaid",
                "unpaid",
                "paid",
                "half paid",
                "refund",
                "cancel",
            ],
            lowercase: true,
        },
        dp: {
            type: Number,
            default: 0,
        },
        deliveryPrice: {
            type: Number,
            default: 0,
        },
        voucherDiscPrice: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        discountPrice: {
            type: Number,
            default: 0,
        },
        taxPercentage: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        serviceChargePercentage: {
            type: Number,
            default: 0,
        },
        serviceCharge: {
            type: Number,
            default: 0,
        },
        donation: {
            type: Number,
            default: 0,
        },
        havePaid: {
            type: Number,
            default: 0,
        },
        billedAmount: {
            type: Number,
            default: 0,
        },
        productionAmount: {
            type: Number,
            default: 0,
        },
        payment: {
            type: String,
            set: capitalizeFirstLetter,
        },
        cardBankName: {
            type: String,
        },
        cardAccountName: {
            type: String,
        },
        cardNumber: {
            type: String,
        },
        notes: {
            type: String,
        },
        refundType: {
            type: Number,
            // 1 full
            // 2 sebagian
        },
        refundNotes: {
            type: String,
        },
        refundReason: {
            type: String,
        },
        voucherCode: {
            type: [String],
            default: [],
            uppercase: true,
        },
        printCount: {
            type: Number,
            default: 0,
        },
        printLaundry: {
            type: Number,
            default: 0,
        },
        printHistory: {
            type: [
                {
                    date: {
                        type: Date,
                        default: Date.now,
                    },
                    staff: String,
                    isLaundry: {
                        type: Boolean,
                        default: false,
                    },
                },
            ],
            default: [],
        },
        invoiceUrl: {
            type: String,
        },
        invoiceImg: {
            image: String,
            imageId: String,
        },
        pickUpStatus: {
            type: String,
            trim: true,
            lowercase: true,
            default: "pending",
        },
        pickupData: {
            date: { type: Date, default: null },
            by: { type: String, default: "" },
        },
        firstOrder: {
            type: Boolean,
            default: false,
        },
        isScan: {
            type: Boolean,
            default: false,
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
    if (!this.orderId) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId(6);
        this.orderId = `ORD${currYear}${number}`;
    }
    if (this.isPickedUp) {
        this.pickUpStatus = "completed";
    }
    if (this.pickupData?.by) {
        this.pickupData.by = capitalizeFirstLetter(this.pickupData.by);
        if (!this.pickupData?.date) {
            this.pickupData.date = new Date();
        }
    }
    if (this.customer.name) {
        this.customer.name = capitalizeFirstLetter(this.customer.name);
    }
    if (this.customer.phone) {
        this.customer.phone = convertToE164(this.customer.phone);
    }
    if (this?.status?.toLowerCase() === "paid" && !this.paymentDate) {
        this.paymentDate = new Date();
    }
    // if (this.orders && Array.isArray(this.orders)) {
    //     this.orders.forEach(order => {
    //         if (order.price && !order.originPrice) {
    //             order.originPrice = order.price;
    //         }
    //     });
    // }
    next();
});

["updateOne", "findOneAndUpdate"].forEach((method) => {
    DataSchema.pre(method, function (next) {
        const update = this.getUpdate();
        if (!update || !update.$set) return next();

        const set = update.$set;

        if (set.pickupData) {
            if (set.isPickedUp) {
                set.pickUpStatus = "completed";
            }
            if (set.pickupData?.by) {
                set.pickupData.by = capitalizeFirstLetter(set.pickupData.by);
            }
            if (!set.pickupData?.date) {
                set.pickupData.date = new Date();
            }
        }
        if (set.customer && set.customer.name) {
            set.customer.name = capitalizeFirstLetter(set.customer.name);
        }
        if (set.customer && set.customer.phone) {
            set.customer.phone = convertToE164(set.customer.phone);
        }
        next();
    });
});

DataSchema.virtual("customerRef", {
    ref: "Members", // model tujuan
    localField: "customer.memberId", // field di schema ini
    foreignField: "memberId", // field di model tujuan
    justOne: true, // karena 1:1
});

DataSchema.virtual("progressRef", {
    ref: "Progress", // model tujuan
    localField: "_id", // field di schema ini
    foreignField: "order", // field di model tujuan
    justOne: true, // karena 1:1
});

// Agar virtual ikut saat toJSON/toObject
DataSchema.set("toJSON", { virtuals: true });
DataSchema.set("toObject", { virtuals: true });
DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Orders", DataSchema);
