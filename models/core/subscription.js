import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema({
    subsId: {
        type: String,
        trim: true,
        default: ""
    },
    serviceRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Services",
        default: null,
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date,
    },
    status: {
        type: String,
        lowercase: true,
        trim: true,
        enum: ["pending", "trial", "canceled", "active", "expired"],
        default: "trial"
    }
}, { timestamps: true });

DataSchema.pre("save", async function (next) {
    if (!this.subsId) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId();
        this.subsId = `SU${currYear}${number}`;
    }
    next();
});

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Subscriptions", DataSchema);