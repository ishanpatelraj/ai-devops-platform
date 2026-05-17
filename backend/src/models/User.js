const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Viewer', 'DevOps Engineer'],
        default: 'Viewer',
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);