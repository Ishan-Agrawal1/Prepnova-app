const express = require("express");
const AptitudeResult = require("../models/AptitudeResult");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userEmail, score, total } = req.body;

    console.log("Aptitude POST request from:", userEmail);

    if (!userEmail || typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    console.log("Saving aptitude result:", { userEmail, score, total });

    const saved = await AptitudeResult.create({
      userEmail: userEmail.toLowerCase(),
      score,
      total,
    });

    console.log("Aptitude result saved successfully:", saved._id);
    res.status(201).json({
      message: "Aptitude result saved",
      result: saved,
    });
  } catch (error) {
    console.error("Aptitude POST error:", error);
    res.status(500).json({ error: "Failed to save aptitude result", details: error.message });
  }
});

router.get("/:email", async (req, res) => {
  try {
    if (!req.params.email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    console.log("Fetching aptitude history for:", req.params.email);

    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => {
        console.log("Aptitude query timeout!");
        resolve([]);
      }, 5000);
    });

    const data = await Promise.race([
      AptitudeResult.find({
        userEmail: req.params.email.toLowerCase(),
      }).sort({ createdAt: -1 }).maxTimeMS(4000).exec(),
      queryTimeout,
    ]);

    console.log("Aptitude records found:", data.length);
    res.json({ data });
  } catch (error) {
    console.error("Aptitude fetch error:", error);
    res.status(500).json({ error: "Failed to fetch aptitude history", details: error.message });
  }
});

module.exports = router;