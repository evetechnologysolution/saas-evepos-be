import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { capitalizeFirstLetter } from "../lib/textSetting.js";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String
    },
    imageId: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    productionPrice: {
        type: Number,
        default: 0
    },
    productionNotes: {
        type: String
    },
    discount: {
        promotion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Promotions",
            default: null,
        },
        amount: {
            type: Number,
            default: 0
        },
        startDate: {
            type: Date,
            default: null
        },
        endDate: {
            type: Date,
            default: null
        }
    },
    discountSpecial: {
        promotion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PromotionSpecial",
            default: null,
        },
        amount: {
            type: Number,
            default: 0
        },
        qtyMin: {
            type: Number,
            default: 0
        },
        qtyFree: {
            type: Number,
            default: 0
        },
        startDate: {
            type: Date,
            default: null
        },
        endDate: {
            type: Date,
            default: null
        },
        selectedDay: {
            type: Number,
            default: null
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Categories",
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Subcategories",
    },
    description: {
        type: String
    },
    unit: {
        type: String,
        lowercase: true,
        default: "pcs"
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    extraNotes: {
        type: Boolean,
        default: false
    },
    listNumber: {
        type: Number,
        default: 0
    },
    amountKg: {
        type: Number,
        default: 0
    },
    variant: [
        {
            variantRef: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
                ref: "Variants",
            },
            isMandatory: {
                type: Boolean,
                default: false
            },
            isMultiple: {
                type: Boolean,
                default: false
            }
        },
    ],
    isLaundryBag: {
        type: Boolean,
        default: false
    },
    isRecommended: {
        type: Boolean,
        default: false
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

DataSchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeFirstLetter(this.name);
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.name) {
        update.$set.name = capitalizeFirstLetter(update.$set.name);
    }
    next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.name) {
        update.$set.name = capitalizeFirstLetter(update.$set.name);
    }
    next();
});

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Products", DataSchema);