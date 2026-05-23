const express = require("express");
const router = express.Router();

const {getMetrics, getLatestMetricServer, createMetric} = require("../controllers/metricController");
const {protect} = require("../middleware/authMiddleware");

// Unprotected ingestion route
router.post("/", createMetric);

router.use(protect);

router.get("/", getMetrics);
router.get("/server/:serverId", getLatestMetricServer);

module.exports = router;