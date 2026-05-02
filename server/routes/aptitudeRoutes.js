const express = require("express");
const aptitudeController = require("../controllers/aptitudeController");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authMiddleware, aptitudeController.createAptitudeResult);
router.get("/:email", aptitudeController.getAptitudeHistory);

module.exports = router;