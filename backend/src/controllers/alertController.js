const Alert = require("../models/Alert");
const catchAsync = require("../utils/catchAsync");

// GET /api/alerts
// supports ?resolved=false&severity=CRITICAL

const getAlerts = catchAsync(async (req, res) => {
    const filter = {};

    //filter by resolved status - "false" string from query param needs conversion
    if(req.query.resolved !== undefined){
        filter.resolved = req.query.resolved === "true";
    }
    if(req.query.severity) filter.severity = req.query.severity;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;
    const total = await Alert.countDocuments(filter);
    const data  = await Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit);

    res.status(200).json({success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }});
});

// GET /api/alerts/:id
const getAlertById = catchAsync(async (req, res) => {
    const alert = await Alert.findById(req.params.id);
    if(!alert){
        return res.status(404).json({success: false, message: "Alert not found"});
    }
    res.status(200).json({success: true, data: alert});
});

//POST /api/alerts
// manually we create alert here (can also be triggered by metricController automatically)
const createAlert = catchAsync(async (req,res) => {
    const {type, message, severity} = req.body;
    const alert = await Alert.create({type, message, severity});
    res.status(201).json({success: true, data: alert});
});

//Patch /api/alerts/:id/resolve
// Mark an alert as resolved
const resolveAlert = catchAsync(async (req, res) => {
    const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        {resolved: true, resolvedAt: new Date()},
        {new: true} //returns the updated doc
    );
    if(!alert){
        return res.status(404).json({success: false, message: "Alert not found"});
    }
    res.status(200).json({success: true, data: alert});
});

module.exports = {getAlerts, getAlertById, createAlert, resolveAlert};