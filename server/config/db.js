import mongoose from "mongoose";

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Add MONGODB_URI to your .env or environment variables."
    );
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log("MongoDB connected ✅");
    console.log("Host:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

export default connectDB;