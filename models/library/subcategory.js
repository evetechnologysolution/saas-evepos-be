import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    listNumber: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    imageId: {
        type: String
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
    outletRef: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Outlets",
        }],
        default: []
    }
}, { timestamps: true });

DataSchema.pre("save", function (next) {
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

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Subcategories", DataSchema);