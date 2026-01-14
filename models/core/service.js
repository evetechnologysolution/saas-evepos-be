import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        uppercase: true,
        trim: true,
        required: true
        // "BASIC", "START UP", "ENTERPRISE"
    },
    price: {
        yearly: {
            type: Number,
            default: 0
        },
        monthly: {
            type: Number,
            default: 0
        }
    },
    discount: {
        yearly: {
            type: Number,
            default: 0
        },
        monthly: {
            type: Number,
            default: 0
        }
    },
    description: {
        type: String,
        default: ""
    },
    listNumber: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Services", DataSchema);