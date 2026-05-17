const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    serviceName:{
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR', 'CRIRICAL'],
        default: 'INFO'
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Log', logSchema);