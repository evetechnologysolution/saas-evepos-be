import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = mongoose.Schema(
    {
        log: {
            type: String,
            required: true,
            trim: true,
        },
        updatedList: {
            type: [
                {
                    label: String,
                    oldValue: mongoose.Schema.Types.Mixed, // Bisa string atau number
                    newValue: mongoose.Schema.Types.Mixed,
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
        uMasterRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserMasters",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
    },
    { timestamps: true },
);

DataSchema.index({ tenantRef: 1, userRef: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("TenantLogs", DataSchema);
