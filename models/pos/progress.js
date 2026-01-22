import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

function extractLastPushedLog(update) {
    const logPush = update?.$push?.log;
    if (!logPush) return null;

    // Case: $push: { log: { $each: [...] } }
    if (logPush.$each && Array.isArray(logPush.$each)) {
        const lastItem = logPush.$each[logPush.$each.length - 1] || {};
        return {
            status: lastItem.status ?? "",
            notes: lastItem.notes ?? "",
        };
    }

    // Case: $push: { log: { status, notes } }
    if (typeof logPush === "object") {
        return {
            status: logPush.status ?? "",
            notes: logPush.notes ?? "",
        };
    }

    return {
        status: "",
        notes: "",
    };
}


const DataSchema = mongoose.Schema(
    {
        orderRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Orders",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
        latestStatus: {
            type: String,
            lowercase: true,
            trim: true,
            default: "",
        },
        latestNotes: {
            type: String,
            trim: true,
            default: "",
        },
        log: {
            type: [
                {
                    date: {
                        type: Date,
                        default: Date.now,
                    },
                    status: {
                        type: String,
                        lowercase: true,
                        trim: true,
                        default: "",
                    },
                    notes: {
                        type: String,
                        trim: true,
                        default: "",
                    },
                    qty: {
                        type: Number,
                        default: 0,
                    },
                    unit: {
                        type: String,
                        lowercase: true,
                        trim: true,
                        default: "",
                    },
                    staff: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Users",
                        default: null,
                        set: (val) => (val === "" ? null : val),
                    },
                },
            ],
            default: [],
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
    if (this.log?.length > 0) {
        const lastStatus = this.log[this.log.length - 1]?.status || "";
        const lastNotes = this.log[this.log.length - 1]?.notes || "";
        this.latestStatus = lastStatus;
        this.latestNotes = lastNotes;
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    const lastLog = extractLastPushedLog(update);

    if (lastLog) {
        update.$set = update.$set || {};

        if (lastLog.status !== null) {
            update.$set.latestStatus = lastLog.status;
        }
        if (lastLog.notes !== null) {
            update.$set.latestNotes = lastLog.notes;
        }
    }

    next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    const lastLog = extractLastPushedLog(update);

    if (lastLog) {
        update.$set = update.$set || {};

        if (lastLog.status !== null) {
            update.$set.latestStatus = lastLog.status;
        }
        if (lastLog.notes !== null) {
            update.$set.latestNotes = lastLog.notes;
        }
    }

    next();
});


DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Progress", DataSchema);
