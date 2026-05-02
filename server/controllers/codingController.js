import CodingResult from "../models/CodingResult.js";

export const createCodingResult = async (req, res, next) => {
  try {
    const { userEmail, question, code, feedback } = req.body;

    if (!userEmail || !question || !code) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid coding data (email, question, and code are required)",
      });
    }

    const saved = await CodingResult.create({
      userEmail: userEmail.toLowerCase(),
      question,
      code,
      feedback,
    });

    res.status(201).json({
      success: true,
      message: "Coding result saved successfully",
      result: saved,
    });
  } catch (error) {
    next(error);
  }
};

export const getCodingHistory = async (req, res, next) => {
  try {
    if (!req.params.email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required",
      });
    }

    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => resolve([]), 5000);
    });

    const data = await Promise.race([
      CodingResult.find({
        userEmail: req.params.email.toLowerCase(),
      })
        .sort({ createdAt: -1 })
        .maxTimeMS(4000)
        .exec(),
      queryTimeout,
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
