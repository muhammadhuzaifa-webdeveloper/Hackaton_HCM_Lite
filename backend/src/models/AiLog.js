import mongoose from "mongoose";

const aiLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    toolUsed: {
      type: String,
      default: null,
    },
    toolInput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    toolOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    response: {
      type: String,
      required: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AiLog", aiLogSchema);
