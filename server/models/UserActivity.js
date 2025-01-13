// UserActivity.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userActivitySchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  activity_type: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserActivity', userActivitySchema);