import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DataSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Conversations",
    },
    reply: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Messages",
    },
    memberRef: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Members",
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        default: null,
    },
    // sender: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     default: null,
    //     refPath: "targetModel",
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
    },
    outletRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlets",
        default: null,
    },
}, { timestamps: true });

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Messages", DataSchema);
