import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "READ"],
      required: true,
    },
    changes: {
      before: { type: Object, default: null },
      after: { type: Object, default: null },
    },
    accessedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
      },
      fullname: String,
      username: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AuditLogs", AuditLogSchema);
