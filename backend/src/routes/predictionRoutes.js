const express = require("express");
const router = express.Router();
const {getPredictions, analyzeServer} = require("../controllers/predictionController");
const {protect} = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getPredictions);
router.post("/analyze", analyzeServer);

module.exports = router;