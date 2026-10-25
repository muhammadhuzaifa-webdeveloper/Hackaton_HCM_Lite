import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      default: "",
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Immutability: prevent updates or deletes on audit logs
auditLogSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"], function () {
  throw new Error("Audit log entries are immutable and cannot be updated or deleted.");
});

export default mongoose.model("AuditLog", auditLogSchema);
