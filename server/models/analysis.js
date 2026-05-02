import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Analysis", analysisSchema);