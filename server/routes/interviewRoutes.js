const express = require("express");
const interviewController = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authMiddleware, interviewController.createInterview);
router.get("/:email", interviewController.getInterviewHistory);

module.exports = router;