import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DataSchema = mongoose.Schema({
    name: {
        type: String,
        uppercase: true,
        trim: true,
        required: [true, "Name wajib diisi"],
    },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    province: { type: String, uppercase: true, trim: true, default: "" },
    city: { type: String, uppercase: true, trim: true, default: "" },
    district: { type: String, uppercase: true, trim: true, default: "" },
    subdistrict: { type: String, uppercase: true, trim: true, default: "" },
    zipCode: { type: String, trim: true, default: "" },
    location: { placeId: String, lat: Number, lng: Number },
    isPrimary: { type: Boolean, default: false },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
    },
}, { timestamps: true });

DataSchema.index({ tenantRef: 1 });

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Outlets", DataSchema);