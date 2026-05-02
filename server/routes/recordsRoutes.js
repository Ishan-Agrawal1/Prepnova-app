import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/records", authMiddleware, async (req, res) => {
  try {
    res.json({
      message: "Protected records data",
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;