const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    serviceName:{
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default: 'INFO'
    },
    message: {
        type: String,
        required: true
    },
    serverId: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: false,
        default: 'Unknown'
    },
    confidence: {
        type: Number,
        required: false,
        default: 0.0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Log', logSchema);