const express = require("express");
const codingController = require("../controllers/codingController");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authMiddleware, codingController.createCodingResult);
router.get("/:email", codingController.getCodingHistory);

module.exports = router;