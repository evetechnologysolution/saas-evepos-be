import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";

const DataSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            default: null,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
        },
        image: {
            type: String,
            default: "",
        },
        imageId: {
            type: String,
            default: "",
        },
        spoiler: {
            type: String,
            default: "",
        },
        content: {
            type: String,
            default: "",
        },
        category: {
            type: [String],
            default: ["Uncategorized"],
        },
        views: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
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

DataSchema.plugin(mongoosePaginate);

DataSchema.pre("save", function (next) {
    if (this.category && Array.isArray(this.category)) {
        this.category = this.category.map(capitalizeFirstLetter).sort((a, b) => a.localeCompare(b));
    }
    next();
});

DataSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.category && Array.isArray(update.$set.category)) {
        update.$set.category = update.$set.category.map(capitalizeFirstLetter).sort((a, b) => a.localeCompare(b));
    }
    next();
});

export default mongoose.model("Articles", DataSchema);
