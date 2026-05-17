const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'CRITICAL'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    resolved: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Alert', alertSchema);