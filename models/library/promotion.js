import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema(
    {
        promotionId: {
            type: String,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            default: "",
        },
        imageId: {
            type: String,
            default: "",
        },
        type: {
            type: Number,
            required: true, // 1 discount 2 package 3 bundle
        },
        amount: {
            type: Number,
            required: true,
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
        validUntil: {
            type: Boolean,
            default: false,
        },
        startDate: {
            type: Date,
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        endDate: {
            type: Date,
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        selectedDay: {
            type: [Number],
            default: [],
            set: (val) => {
                // "" / null / undefined → []
                if (val === "" || val === null || val === undefined) {
                    return [];
                }

                // sudah array → normalize
                if (Array.isArray(val)) {
                    return val.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
                }

                // string "1,2,3"
                if (typeof val === "string") {
                    return val
                        .split(",")
                        .map((v) => Number(v.trim()))
                        .filter((v) => !Number.isNaN(v));
                }

                // single number / numeric string
                const num = Number(val);
                return Number.isNaN(num) ? [] : [num];
            },
        },
        products: {
            type: [mongoose.Types.ObjectId],
            default: [],
        },
        isAvailable: {
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
    if (!this.promotionId) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId();
        this.promotionId = `PR${currYear}${number}`;
    }
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
DataSchema.plugin(aggregatePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

//"Promotions" is the table thats gonna show up in Mongo DB
export default mongoose.model("Promotions", DataSchema);
