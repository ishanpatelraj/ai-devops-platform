const Prediction = require("../models/Prediction");
const catchAsync = require("../utils/catchAsync");
const {detectAnomaly, predictFailure} = require("../ml/mlServices");

// GET /api/predictions
// supports ?serverId=server-01&predictionType=anomaly

const getPredictions = catchAsync(async (req, res) => {
    const filter = {};
    if(req.query.serverId) filter.serverId = req.query.serverId;
    if(req.query.predictionType) filter.predictionType = req.query.predictionType;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const total = await Prediction.countDocuments(filter);
    const data  = await Prediction.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit);

    res.status(200).json({success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }});
});

// POST /api/predictions/analyze
// manually trigger ML analysis for a server
// body: {serverId, cpuUsage, memoryUsage, diskUsage, predictionType}
const analyzeServer = catchAsync(async (req, res) => {
  const {serverId, cpuUsage, memoryUsage, diskUsage, predictionType} = req.body;
  if (!serverId || !predictionType) {
    return res.status(400).json({
      success: false,
      message: "serverId and predictionType are required",
    });
  }

  const metricData = { serverId, cpuUsage, memoryUsage, diskUsage };

  let mlResult = null;

  //predictionType -> ml function
  if (predictionType === "anomaly") {
    mlResult = await detectAnomaly(metricData);
  } else if (predictionType === "failure") {
    mlResult = await predictFailure(metricData);
  } else {
    return res.status(400).json({
      success: false,
      message: "predictionType must be 'anomaly' or 'failure'",
    });
  }

  // ML service was unavailable
  if (!mlResult) {
    return res.status(503).json({
      success: false,
      message: "ML service is currently unavailable. Please try again later.",
    });
  }

  // Save the prediction result to the database
  const prediction = await Prediction.create({
    serverId,
    predictionType,
    result: mlResult.result || (mlResult.isAnomaly ? "ANOMALY_DETECTED" : "NORMAL") || "UNKNOWN",
    confidence: mlResult.confidence || mlResult.probability || 0,
    details: mlResult,
  });
  res.status(201).json({success: true, data: prediction});
});

module.exports = {getPredictions, analyzeServer};