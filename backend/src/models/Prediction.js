const mongoose = require('mongoose');
const predictionSchema = new mongoose.Schema(
    {
        serverId: {
            type: String,
            required: [true, 'ServerID is required'],
            index: true,
        },
        predictionType: {
            type: String,
            enum: ["anomaly", "failure", "log_classification"],
            required: true,
        },
        result: {
            type: String, // e.g., "ANOMALY_DETECTED", "NORMAL", "HIGH_RISK"
            required: true,
        },
        // Confidence score from the ML model (0 to 1)
        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0,
        },
        // Raw details returned by the ML service
        details: {
            type: mongoose.Schema.Types.Mixed, // Allows any shape of data
            default: {},
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }
);

module.exports = mongoose.model('Prediction', predictionSchema);