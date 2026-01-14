import mongoose from "mongoose";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        required: true
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
    outletRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlets",
        default: null,
    },
}, { timestamps: true });

//'Counters' is the table thats gonna show up in Mongo DB
export default mongoose.model('Counters', DataSchema);