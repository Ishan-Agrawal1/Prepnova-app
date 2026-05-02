import express from "express";
import * as resumeController from "../controllers/resumeController.js";

const router = express.Router();

// Resume upload route
router.post("/upload", resumeController.upload.single("resume"), resumeController.uploadResume);

// Get analyses by query email
router.get("/analyses", resumeController.getAnalyses);

// Get analyses by path email
router.get("/analyses/:email", resumeController.getAnalysesByEmail);

export default router;
