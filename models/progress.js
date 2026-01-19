import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

function extractLastPushedStatus(update) {
    const logPush = update?.$push?.log;

    if (!logPush) return null;

    // Jika menggunakan $each
    if (logPush.$each && Array.isArray(logPush.$each)) {
        const lastItem = logPush.$each[logPush.$each.length - 1];
        return lastItem?.status || null;
    }

    // Jika hanya 1 object biasa
    if (typeof logPush === "object" && logPush.status) {
        return logPush.status;
    }

    return null;
}

const DataSchema = mongoose.Schema({
    orderRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders",
        default: null,
        set: val => val === "" ? null : val
    },
    latestStatus: {
        type: String,
        lowercase: true,
        trim: true,
        enum: ["masuk", "cuci", "setrika", "lipat", "packing", "antar", "selesai"],
        default: "masuk"
    },
    log: {
        type: [
            {
                date: {
                    type: Date,
                    default: Date.now
                },
                status: {
                    type: String,
                    lowercase: true,
                    trim: true,
                    enum: ["cuci", "setrika", "lipat", "packing", "locker", "antar", "selesai"],
                    default: ""
                },
                qty: {
                    type: Number,
                    default: 0
                },
                unit: {
                    type: String,
                    lowercase: true,
                    trim: true,
                    default: ""
                },
                staff: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users",
                    default: null,
                    set: val => val === "" ? null : val
                }
            },
        ],
        default: []
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
        set: val => val === "" ? null : val
    },
    outletRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlets",
        default: null,
        set: val => val === "" ? null : val
    },
}, { timestamps: true });

DataSchema.pre("save", function (next) {
    if (this.log?.length > 0) {
        const lastStatus = this.log[this.log.length - 1]?.status;
        if (lastStatus) {
            this.latestStatus = lastStatus;
        }
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    const lastStatus = extractLastPushedStatus(update);
    if (lastStatus) {
        update.$set = update.$set || {};
        update.$set.latestStatus = lastStatus;
    }
    next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    const lastStatus = extractLastPushedStatus(update);
    if (lastStatus) {
        update.$set = update.$set || {};
        update.$set.latestStatus = lastStatus;
    }
    next();
});

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Progress", DataSchema);