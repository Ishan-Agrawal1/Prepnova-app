const express = require("express");
const Interview = require("../models/interview");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userEmail, questions, answers, feedback } = req.body;

    console.log("Interview POST request from:", userEmail);

    if (!userEmail || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    console.log("Saving interview for:", userEmail);

    const saved = await Interview.create({
      userEmail: userEmail.toLowerCase(),
      questions,
      answers,
      feedback,
    });

    console.log("Interview saved successfully:", saved._id);
    res.status(201).json({
      message: "Interview result saved",
      interview: saved,
    });
  } catch (error) {
    console.error("Interview POST error:", error);
    res.status(500).json({ error: "Failed to save interview result", details: error.message });
  }
});

router.get("/:email", async (req, res) => {
  try {
    if (!req.params.email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    console.log("Fetching interview history for:", req.params.email);

    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => {
        console.log("Interview query timeout!");
        resolve([]);
      }, 5000);
    });

    const data = await Promise.race([
      Interview.find({
        userEmail: req.params.email.toLowerCase(),
      }).sort({ createdAt: -1 }).maxTimeMS(4000).exec(),
      queryTimeout,
    ]);

    console.log("Interview records found:", data.length);
    res.json({ data });
  } catch (error) {
    console.error("Interview fetch error:", error);
    res.status(500).json({ error: "Failed to fetch interview history", details: error.message });
  }
});

module.exports = router;  