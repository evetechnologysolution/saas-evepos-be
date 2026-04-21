import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter, convertToE164 } from "../../lib/textSetting.js";
import { generateRandomOrderId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema(
    {
        tempId: {
            type: String,
        },
        orderId: {
            type: String,
        },
        bookingDate: {
            type: Date,
            default: null,
        },
        paymentDate: {
            type: Date,
        },
        pickupDateTime: {
            type: Date,
            default: null
        },
        deliveryDate: {
            type: Date,
            default: null
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
                    ref: "Products",
                    default: null,
                    set: (val) => (val === "" ? null : val),
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
                baseTime: {
                    type: Number,
                    default: 0,
                },
                promotionType: {
                    type: Number,
                    default: 0,
                },
                promotionLabel: {
                    type: String,
                    trim: true,
                    set: capitalizeFirstLetter,
                    default: "",
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
                            notes: {
                                type: String,
                                trim: true,
                                default: "",
                            },
                            productionNotes: {
                                type: String,
                                trim: true,
                                default: "",
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
            enum: ["backlog", "awaiting payment", "unpaid", "paid", "half paid", "refund", "cancel"],
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
        deliveryPriceDisc: {
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
        havePaid: {
            type: Number,
            default: 0,
        },
        billedAmount: {
            type: Number,
            default: 0,
        },
        roundingAmount: {
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
        const number = generateRandomOrderId(5);

        this.orderId = number;
    }
    if (this.orderType === "delivery") {
        this.bookingDate = new Date();
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

DataSchema.virtual("orders.masterProgressRef", {
    ref: "Products", // model tujuan
    localField: "orders.id", // field di schema ini
    foreignField: "_id", // field di model tujuan
    justOne: true, // karena 1:1
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
    foreignField: "orderRef", // field di model tujuan
    justOne: true, // karena 1:1
});

// DataSchema.virtual("progressDetail").get(function () {
//     if (!this.progressRef || !this.progressRef.log) return [];

//     return this.orders.map((orderItem) => {
//         const logs = this.progressRef.log.filter((l) => String(l.id) === String(orderItem.id));

//         // total qty per status
//         const statusSummary = {};

//         logs.forEach((l) => {
//             if (!statusSummary[l.status]) {
//                 statusSummary[l.status] = 0;
//             }
//             statusSummary[l.status] += l.qty;
//         });

//         return {
//             id: orderItem.id,
//             name: orderItem.name,
//             orderedQty: orderItem.qty,
//             progressByStatus: statusSummary,
//         };
//     });
// });

DataSchema.virtual("progressDetail").get(function () {
    if (!this.orders) return [];
    if (!Array.isArray(this.orders)) return [];

    const progressMap = {};

    // ================= HITUNG TOTAL PROGRESS PER PRODUK =================
    if (this.progressRef?.log) {
        for (const log of this.progressRef.log) {
            const id = String(log.id);
            const status = log.status;
            const itemRef = String(log.itemRef || "");
            const orderedQty = Number(log.orderedQty || 0);

            const key = itemRef
                ? `${id}__${itemRef}`
                : `${id}__${orderedQty}`;

            if (!progressMap[key]) progressMap[key] = {};
            if (!progressMap[key][status]) progressMap[key][status] = 0;

            progressMap[key][status] += Number(log.qty || 0);
        }
    }

    // ================= DISTRIBUSI PROGRESS KE ITEM =================
    return this.orders.map((orderItem) => {
        const itemId = String(orderItem.id);
        const itemRef = orderItem?._id ? String(orderItem._id) : "";
        const orderedQty = Number(orderItem.qty || 0);

        const key = itemRef
            ? `${itemId}__${itemRef}`
            : `${itemId}__${orderedQty}`;

        const progressByStatus = {};
        const statusMap = progressMap[key] || {};

        let processedQty = 0;

        for (const status in statusMap) {
            const qty = statusMap[status];

            progressByStatus[status] = qty;
            processedQty += qty;
        }

        const remainingQty = Math.max(
            0,
            Math.round((orderedQty - processedQty) * 10) / 10
        );

        return {
            itemRef: itemRef || null,
            id: orderItem.id,
            name: orderItem.name,
            orderedQty,
            progressByStatus,
            processedQty,
            remainingQty,
        };
    });
});

// Agar virtual ikut saat toJSON/toObject
DataSchema.set("toJSON", { virtuals: true });
DataSchema.set("toObject", { virtuals: true });
DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Orders", DataSchema);
