require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const aptitudeRoutes = require("./routes/aptitudeRoutes");
const codingRoutes = require("./routes/codingRoutes");
const recordsRoutes = require("./routes/recordsRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
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