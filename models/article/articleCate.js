import mongoose from "mongoose";

const DataSchema = mongoose.Schema(
    {
        name: {
            type: [String],
            default: [""],
        },
        tenantRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenants",
            default: null,
            set: (val) => (val === "" ? null : val),
        },
    },
    { timestamps: true },
);

export default mongoose.model("ArticleCategory", DataSchema);
