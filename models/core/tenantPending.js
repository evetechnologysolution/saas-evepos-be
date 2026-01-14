import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DataSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true,
        trim: true,
        required: [true, "Username wajib diisi"],
    },
    phone: {
        type: String,
        trim: true,
        required: [true, "Phone wajib diisi"],
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, "Email wajib diisi"],
        match: [/^\S+@\S+\.\S+$/, "Email tidak valid"],
    },
    password: {
        type: String,
        trim: true,
        required: [true, "Password wajib diisi"],
    },
    token: { type: String, default: "" },
    tokenExpiry: { type: Date },
}, { timestamps: true });

DataSchema.plugin(mongoosePaginate);

// the table thats gonna show up in Mongo DB
export default mongoose.model("TenantPendings", DataSchema);