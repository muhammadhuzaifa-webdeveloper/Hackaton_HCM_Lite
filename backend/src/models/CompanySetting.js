import mongoose from "mongoose";

const companySettingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    officeStartTime: {
      type: String,
      default: "09:00",
    },
    graceTimeMinutes: {
      type: Number,
      default: 15,
    },
    halfDayThresholdHours: {
      type: Number,
      default: 5,
    },
    weekendDays: {
      type: [String],
      default: ["Saturday", "Sunday"],
    },
    officeLocation: {
      latitude: { type: Number, default: 24.8607 },
      longitude: { type: Number, default: 67.0011 },
      radiusMeters: { type: Number, default: 150 },
      address: { type: String, default: "Main Office" },
    },
    latePenaltyRule: {
      enabled: { type: Boolean, default: true },
      lateCountThreshold: { type: Number, default: 3 }, // 3 lates
      deductionDays: { type: Number, default: 0.5 }, // 0.5 day penalty
    },
  },
  { timestamps: true }
);

export default mongoose.model("CompanySetting", companySettingSchema);
