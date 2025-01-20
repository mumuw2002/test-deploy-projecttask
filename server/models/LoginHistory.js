// server/models/LoginHistory.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoginHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    ip: { type: String },
    // Add other fields as needed (e.g., user agent, location)
});

module.exports = mongoose.model('LoginHistory', LoginHistorySchema);