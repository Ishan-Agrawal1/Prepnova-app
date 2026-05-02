import express from "express";
import * as codingController from "../controllers/codingController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, codingController.createCodingResult);
router.get("/:email", codingController.getCodingHistory);

export default router;