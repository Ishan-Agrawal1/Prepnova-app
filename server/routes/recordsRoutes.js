const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/records", authMiddleware, async (req, res) => {

  try {

    res.json({
      message: "Protected records data",
      user: req.user
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }

});

module.exports = router;