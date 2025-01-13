//Noti.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Noti.js
const notificationSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Spaces' }, 
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    type: { type: String, enum: ['invitation', 'roleChange', 'removal', 'memberAdded', 'announcement'], required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },    
    
    announcement: { type: mongoose.Schema.Types.ObjectId, ref: 'SystemAnnouncement' },
});

module.exports = mongoose.model('Notification', notificationSchema);