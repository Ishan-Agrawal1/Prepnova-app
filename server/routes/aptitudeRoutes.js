import express from "express";
import * as aptitudeController from "../controllers/aptitudeController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, aptitudeController.createAptitudeResult);
router.get("/:email", aptitudeController.getAptitudeHistory);

export default router;