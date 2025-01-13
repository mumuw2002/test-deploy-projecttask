//SystemAnnouncements.js
const mongoose = require('mongoose');

const systemAnnouncementSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true 
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    targetAudience: {
        type: String,
        default: 'user'
    },
    expirationDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date


});

module.exports = mongoose.model('SystemAnnouncement', systemAnnouncementSchema);
