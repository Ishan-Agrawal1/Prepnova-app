import Interview from "../models/interview.js";

export const createInterview = async (req, res, next) => {
  try {
    const { userEmail, questions, answers, feedback } = req.body;

    if (!userEmail || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid interview data (email, questions, and answers are required)",
      });
    }

    const saved = await Interview.create({
      userEmail: userEmail.toLowerCase(),
      questions,
      answers,
      feedback,
    });

    res.status(201).json({
      success: true,
      message: "Interview result saved successfully",
      interview: saved,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewHistory = async (req, res, next) => {
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
      Interview.find({
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
