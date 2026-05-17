const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
    serverId : {
        type: String,
        required: true,
        index: true
    },
    cpuUsage: {
        type: Number,
        required: true
    },
    memoryUsage: {
        type: Number,
        required: true
    },
    diskUsage: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: '30d'
    }
});

module.exports = mongoose.model('Metric', metricSchema);