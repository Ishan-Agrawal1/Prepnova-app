import AptitudeResult from "../models/AptitudeResult.js";

export const createAptitudeResult = async (req, res, next) => {
  try {
    const { userEmail, score, total } = req.body;

    if (!userEmail || typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({
        success: false,
        message: "Please provide valid aptitude data (email, score, and total are required)",
      });
    }

    const saved = await AptitudeResult.create({
      userEmail: userEmail.toLowerCase(),
      score,
      total,
    });

    res.status(201).json({
      success: true,
      message: "Aptitude result saved successfully",
      result: saved,
    });
  } catch (error) {
    next(error);
  }
};

export const getAptitudeHistory = async (req, res, next) => {
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
      AptitudeResult.find({
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
