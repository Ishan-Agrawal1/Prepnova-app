const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    questions: {
      type: [String],
      default: [],
    },
    answers: {
      type: [String],
      default: [],
    },
    feedback: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    mode: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);