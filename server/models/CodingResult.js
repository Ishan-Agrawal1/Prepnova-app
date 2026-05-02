import mongoose from "mongoose";

const codingResultSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    question: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CodingResult", codingResultSchema);