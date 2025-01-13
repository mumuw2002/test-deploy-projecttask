// models/AnnouncementView.js
const mongoose = require('mongoose');

const announcementViewSchema = new mongoose.Schema({
  announcementId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SystemAnnouncement', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  viewedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('AnnouncementView', announcementViewSchema);