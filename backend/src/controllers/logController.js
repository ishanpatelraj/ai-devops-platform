const Log = require('../models/Log')
const catchAsync = require('../utils/catchAsync');
const paginate = require("../utils/pagination");
const { getIo } = require("../config/socket");
const { classifyLog } = require("../ml/mlServices");

const getLogs = catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if(req.query.serviceName) filter.serviceName = req.query.serviceName;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const total = await Log.countDocuments(filter);
    const data  = await Log.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit);

    res.status(200).json({ success: true, data, totalPages: Math.ceil(total / limit), pagination: { total, page, limit } });
})

// GET /api/logs/:id
const getLogById = catchAsync(async (req, res) => {
    const log = await Log.findById(req.params.id);

    if(!log){
        return res.status(404).json({success: false, message: "Log not found"});
    }

    res.status(200).json({success: true, data: log});
});

const createLog = catchAsync(async (req, res) => {
    const {serviceName, severity, message, serverId} = req.body;

    // Automatically classify the log using ML service
    let category = "Unknown";
    let confidence = 0.0;
    try {
        const classification = await classifyLog(message);
        if (classification && classification.category) {
            category = classification.category;
            confidence = classification.confidence || 0.0;
        }
    } catch (err) {
        console.error("Failed to automatically classify log:", err.message);
    }

    const log = await Log.create({
        serviceName,
        severity,
        message,
        serverId,
        category,
        confidence
    });

    try{
        getIo().emit("new_log", log);
    }catch(e){
        //no response as socket not critical here
    }

    res.status(201).json({success: true, data: log});
});

//Delete /api/logs/:id this is admin only
const deleteLog = catchAsync(async (req, res) => {
    const log = await Log.findByIdAndDelete(req.params.id);

    if(!log){
        return res.status(404).json({success: false, message: "Log not found"});
    }

    res.status(200).json({success: true, message: "Log deleted successfully"});
});

module.exports = {getLogs, getLogById, createLog, deleteLog}