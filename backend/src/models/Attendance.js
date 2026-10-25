import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["present", "late", "half_day", "absent", "missing_checkout", "on_leave"],
      required: true,
      default: "present",
    },
    source: {
      type: String,
      enum: ["web", "camera", "correction"],
      default: "web",
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      distanceMeters: { type: Number },
      isWithinRadius: { type: Boolean, default: true },
    },
    faceDetected: {
      type: Boolean,
      default: false,
    },
    correctionRequest: {
      requested: { type: Boolean, default: false },
      requestedCheckIn: { type: Date },
      requestedCheckOut: { type: Date },
      reason: { type: String },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewComment: { type: String },
      reviewedAt: { type: Date },
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
