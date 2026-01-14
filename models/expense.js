import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { capitalizeFirstLetter } from "../lib/textSetting.js";

const DataSchema = mongoose.Schema({
    code: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5, 6, 7, 8],
        // 1 Beban Gaji
        // 2 Beban Sewa Gedung
        // 3 Beban Listrik dan Telepon
        // 4 Beban Lain-lain
        // 5 Pembelian
        // 6 Potongan Pembelian
        // 7 Retur Pembelian dan Pengurangan Harga
        // 8 Pengeluaran Outlet
    },
    // title: {
    //     type: String,
    //     required: true,
    // },
    staff: {
        type: String,
        default: "",
        set: capitalizeFirstLetter
    },
    description: {
        type: String,
        default: ""
    },
    amount: {
        type: Number,
        default: 0,
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

DataSchema.plugin(mongoosePaginate);

//"Expenses" is the table thats gonna show up in Mongo DB
export default mongoose.model("Expenses", DataSchema);