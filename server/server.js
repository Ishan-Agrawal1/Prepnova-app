import "dotenv/config";

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import connectDB from "./config/db.js";
import { auth } from "./lib/auth.js";
import errorHandler from "./middleware/errorHandler.js";

// Route imports
import interviewRoutes from "./routes/interviewRoutes.js";
import aptitudeRoutes from "./routes/aptitudeRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import recordsRoutes from "./routes/recordsRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS — must allow credentials for Better Auth cookies ───
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://192.168.1.5:8081",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Be permissive in dev
      }
    },
    credentials: true,
  })
);

// ─── Explicit CORS for Better Auth routes ───
// toNodeHandler bypasses Express's response pipeline, so the global
// CORS middleware above may not attach headers. This ensures
// Access-Control-Allow-Credentials is sent on auth API responses.
app.use("/api/auth", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Better-Auth-Cookie");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ─── Better Auth handler — must be BEFORE express.json() ───
app.all("/api/auth/{*any}", toNodeHandler(auth));

// ─── Body parsing (after Better Auth) ───
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── App Routes ───
app.use("/api/interviews", interviewRoutes);
app.use("/api/aptitude", aptitudeRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api", recordsRoutes);
app.use("/", resumeRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Global error handler (must be after routes)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectDB();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error(
      "Database connection warning: server will still start but persistence is disabled.",
      error.message
    );
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();