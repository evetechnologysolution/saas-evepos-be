import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";

const DataSchema = mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: "",
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

DataSchema.pre("save", async function (next) {
    if (this.name) {
        this.name = capitalizeFirstLetter(this.name);
    }
    next();
});

["updateOne", "findByIdAndUpdate", "findOneAndUpdate"].forEach((method) => {
    DataSchema.pre(method, async function (next) {
        const update = this.getUpdate();
        if (!update || !update.$set) return next();

        const set = update.$set;

        if (set.name) {
            set.name = capitalizeFirstLetter(set.name);
        }
        next();
    });
});

DataSchema.index({ tenantRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("ProgressLabel", DataSchema);
