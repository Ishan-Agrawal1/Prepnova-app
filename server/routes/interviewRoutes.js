import express from "express";
import * as interviewController from "../controllers/interviewController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, interviewController.createInterview);
router.get("/:email", interviewController.getInterviewHistory);

export default router;