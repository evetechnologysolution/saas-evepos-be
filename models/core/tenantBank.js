import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = mongoose.Schema(
    {
        bankName: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        accountNumber: {
            type: String,
            required: true,
            trim: true,
        },
        accountHolderName: {
            type: String,
            required: true,
            trim: true,
        },
        imageAccount: {
            image: { type: String, default: "" },
            imageId: { type: String, default: "" },
        },
        imageHolder: {
            image: { type: String, default: "" },
            imageId: { type: String, default: "" },
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

DataSchema.index({ tenantRef: 1, outletRef: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("TenantBanks", DataSchema);
