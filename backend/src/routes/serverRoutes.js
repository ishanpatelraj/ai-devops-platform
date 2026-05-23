const express = require("express");
const router  = express.Router();
const Server  = require("../models/Server");
const Metric  = require("../models/Metric");
const catchAsync = require("../utils/catchAsync");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// GET /api/servers — list all registered servers with latest metric snapshot
router.get("/", catchAsync(async (req, res) => {
    const servers = await Server.find().sort({ lastSeen: -1 });

    // Attach latest metric to each server
    const enriched = await Promise.all(
        servers.map(async (srv) => {
            const metric = await Metric.findOne({ serverId: srv.serverId }).sort({ timestamp: -1 });
            return {
                ...srv.toObject(),
                latestMetric: metric || null,
            };
        })
    );

    res.status(200).json({ success: true, data: enriched });
}));

// GET /api/servers/:id
router.get("/:id", catchAsync(async (req, res) => {
    const srv = await Server.findById(req.params.id);
    if (!srv) return res.status(404).json({ success: false, message: "Server not found" });
    res.status(200).json({ success: true, data: srv });
}));

// POST /api/servers — register a new server
router.post("/", catchAsync(async (req, res) => {
    const { serverId, name, ipAddress, os, tags } = req.body;
    const srv = await Server.create({ serverId, name, ipAddress, os, tags, assignedTo: req.user._id });
    res.status(201).json({ success: true, data: srv });
}));

// PATCH /api/servers/:id/status
router.patch("/:id/status", catchAsync(async (req, res) => {
    const srv = await Server.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status, lastSeen: new Date() },
        { new: true }
    );
    if (!srv) return res.status(404).json({ success: false, message: "Server not found" });
    res.status(200).json({ success: true, data: srv });
}));

// DELETE /api/servers/:id
router.delete("/:id", catchAsync(async (req, res) => {
    const srv = await Server.findByIdAndDelete(req.params.id);
    if (!srv) return res.status(404).json({ success: false, message: "Server not found" });
    res.status(200).json({ success: true, message: "Server removed" });
}));

module.exports = router;
