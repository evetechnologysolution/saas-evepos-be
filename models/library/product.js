import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";

const DataSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
        },
        imageId: {
            type: String,
        },
        price: {
            type: Number,
            required: true,
        },
        productionPrice: {
            type: Number,
            default: 0,
        },
        productionNotes: {
            type: String,
            trim: true,
            default: "",
        },
        discount: {
            promotionRef: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Promotions",
                default: null,
                set: (val) => (val === "" ? null : val),
            },
            amount: {
                type: Number,
                default: 0,
            },
            qtyMin: {
                type: Number,
                default: 0,
            },
            qtyFree: {
                type: Number,
                default: 0,
            },
            startDate: {
                type: Date,
                default: null,
            },
            endDate: {
                type: Date,
                default: null,
            },
            selectedDay: {
                type: Number,
                default: null,
            },
            isSpecial: {
                type: Boolean,
                default: false,
            },
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categories",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        subcategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subcategories",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        unit: {
            type: String,
            trim: true,
            lowercase: true,
            default: "pcs",
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        extraNotes: {
            type: Boolean,
            default: false,
        },
        listNumber: {
            type: Number,
            default: 0,
        },
        amountKg: {
            type: Number,
            default: 0,
        },
        variant: {
            type: [
                {
                    variantRef: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Variants",
                        default: null,
                        set: (val) => (val === "" ? null : val),
                    },
                    isMandatory: {
                        type: Boolean,
                        default: false,
                    },
                    isMultiple: {
                        type: Boolean,
                        default: false,
                    },
                },
            ],
            default: [],
        },
        isRecommended: {
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

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Products", DataSchema);
