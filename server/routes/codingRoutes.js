const express = require("express");
const CodingResult = require("../models/CodingResult");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userEmail, question, code, feedback } = req.body;

    console.log("Coding POST request from:", userEmail);

    if (!userEmail || !question || !code) {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    console.log("Saving coding result for question:", question.substring(0, 50));

    const saved = await CodingResult.create({
      userEmail: userEmail.toLowerCase(),
      question,
      code,
      feedback,
    });

    console.log("Coding result saved successfully:", saved._id);
    res.status(201).json({
      message: "Coding result saved",
      result: saved,
    });
  } catch (error) {
    console.error("Coding POST error:", error);
    res.status(500).json({ error: "Failed to save coding result", details: error.message });
  }
});

router.get("/:email", async (req, res) => {
  try {
    if (!req.params.email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    console.log("Fetching coding history for:", req.params.email);

    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => {
        console.log("Coding query timeout!");
        resolve([]);
      }, 5000);
    });

    const data = await Promise.race([
      CodingResult.find({
        userEmail: req.params.email.toLowerCase(),
      }).sort({ createdAt: -1 }).maxTimeMS(4000).exec(),
      queryTimeout,
    ]);

    console.log("Coding records found:", data.length);
    res.json({ data });
  } catch (error) {
    console.error("Coding fetch error:", error);
    res.status(500).json({ error: "Failed to fetch coding history", details: error.message });
  }
});

module.exports = router;