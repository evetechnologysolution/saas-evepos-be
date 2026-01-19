import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
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
        set: val => val === "" ? null : val
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
        set: val => val === "" ? null : val
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

DataSchema.index({ tenantRef: 1, serviceRef: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Subscriptions", DataSchema);