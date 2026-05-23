const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema(
    {
        serverId: {
            type: String,
            required: [true, 'ServerID is required'],
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Server name is required'],
            trim: true,
        },
        ipAddress: {
            type: String,
            required: [true, 'IP address is required'],
        },
        os: {
            type: String,
            default: 'Unknown', // e.g. "Ubuntu 22.04", "Windows Server 2022"
        },
        status: {
            type: String,
            enum: ['Online', 'Offline', 'Degraded'],
            default: 'Offline',
        },
        tags: [String], // e.g. ['production', 'web', 'us-east']
        lastSeen: {
            type: Date,
            default: Date.now,
            // Updated every time a metric is received from this server
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Which DevOps engineer owns this server
        },
    },
    {timestamps: true}
);

module.exports = mongoose.model('Server', serverSchema);