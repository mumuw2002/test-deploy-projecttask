//server\models\Complaint.js
const mongoose = require('mongoose');

const ComplaintsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    required: true
  },
  complaintContent: {
    type: String,
    required: true
  },
  screenshots: [String], 
  additionalInfo: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed'],
    default: 'Open'
  },
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  complaintNumber: {
    type: String,
    unique: true
  },
  resolutionDetails: String,
  resolvedAt: Date
});

ComplaintsSchema.path('status').set(function (newStatus) {
  if (this.status !== newStatus) {
    console.log(`Status changed from ${this.status} to ${newStatus}`);
  }
  return newStatus;
});

module.exports = mongoose.model('Complaints', ComplaintsSchema);