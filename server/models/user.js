import mongoose from "mongoose";

// NOTE: This model is kept for reference / backward compatibility.
// Better Auth manages its own 'user' collection with its schema.
// Existing Mongoose queries referencing this model should be
// migrated to use Better Auth's user management.

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Student",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);