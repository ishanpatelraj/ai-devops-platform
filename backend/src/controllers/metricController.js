const Metric = require("../models/Metric");
const catchAsync = require("../utils/catchAsync");
const paginate = require("../utils/pagination");
const { getIo } = require("../config/socket");
const { detectAnomaly } = require("../ml/mlServices");
const Alert = require("../models/Alert");

// Get /api/metrics
// supports filtering by serverId

const getMetrics = catchAsync(async (req, res) => {
    const filter = {};

    if (req.query.serverId) filter.serverId = req.query.serverId;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const total = await Metric.countDocuments(filter);
    const data  = await Metric.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit);

    res.status(200).json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
})

// get /api/metrics/server/:serverId
// returns the latest metric reading for a specific server
const getLatestMetricServer = catchAsync(async (req, res) => {
    const metric = await Metric.findOne({ serverId: req.params.serverId }).sort({
        timestamp: -1,
    });

    if (!metric) {
        return res
            .status(404)
            .json({ success: false, message: "No metric found for this server" });
    }

    res.status(200).json({ success: true, data: metric });
});

// post here /api/metrics
// called by the python script every few seconds

const createMetric = catchAsync(async (req, res) => {
    const { serverId, cpuUsage, memoryUsage, diskUsage, networkUsage = 0 } = req.body;

    // Save the metric to mongo
    const metric = await Metric.create({ serverId, cpuUsage, memoryUsage, diskUsage, networkUsage });
    try { getIo().emit("new_metric", metric); } catch (err) {}

    if (cpuUsage > 90) {
        const alert = await Alert.create({
            type: "CPU",
            message: `High CPU usage detected on server ${serverId}: ${cpuUsage}%`,
            severity: "CRITICAL",
        });
        try { getIo().emit("new_alert", alert); } catch (e) {}
    }

    detectAnomaly({ serverId, cpuUsage, memoryUsage, diskUsage, networkUsage })
        .then((mlResult) => {
            if (mlResult && mlResult.isAnomaly) {
                Alert.create({
                    type: "Network",
                    message: `ML anomaly detected on ${serverId}: ${mlResult.details}`,
                    severity: "WARNING",
                }).then((alert) => {
                    try { getIo().emit("new_alert", alert); } catch (err) {}
                });
            }
        })
        .catch(() => {});

    res.status(201).json({ success: true, data: metric });
});

module.exports = {
    getMetrics,
    getLatestMetricServer,
    createMetric
};