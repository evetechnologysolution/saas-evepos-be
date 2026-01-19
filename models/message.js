import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversations",
        default: null,
        set: val => val === "" ? null : val
    },
    reply: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages",
        default: null,
        set: val => val === "" ? null : val
    },
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Members",
        default: null,
        set: val => val === "" ? null : val
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        default: null,
        set: val => val === "" ? null : val
    },
    // sender: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     refPath: "targetModel",
    //     default: null,
    //     set: val => val === "" ? null : val
    // },
    // targetModel: {
    //     type: String,
    //     required: true,
    //     enum: ["Members", "Users"],
    // },
    text: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    imageId: {
        type: String,
        default: ""
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    tenantRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenants",
        default: null,
        set: val => val === "" ? null : val
    },
    outletRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlets",
        default: null,
        set: val => val === "" ? null : val
    },
}, { timestamps: true });

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Messages", DataSchema);
