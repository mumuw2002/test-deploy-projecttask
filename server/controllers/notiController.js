const Spaces = require('../models/Space');
const User = require("../models/User");
const SystemAnnouncement = require('../models/SystemAnnouncements');
const Notification = require('../models/Noti');
const moment = require('moment');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate('space', 'SpaceName')
            .populate('leader', 'username')
            .populate('announcement', 'title expirationDate') // Populate expirationDate
            .lean();

        const now = new Date();
        const activeAnnouncements = await SystemAnnouncement.find({ 
            expirationDate: { $gte: now }, 
            isDeleted: false,
            recipients: req.user._id  
        });

        notifications.push(...activeAnnouncements.map(announcement => ({
            type: 'announcement',
            announcement: announcement, 
            formattedDate: moment(announcement.createdAt).format('DD/MM'),
            formattedTime: moment(announcement.createdAt).format('HH:mm')
        })));

        notifications.forEach(notification => {
            notification.formattedDate = moment(notification.createdAt).format('DD/MM');
            notification.formattedTime = moment(notification.createdAt).format('HH:mm');
        });

        res.render('layouts/notifications', { 
            notifications,
            user: req.user,
            userImage: req.user.profileImage,
            userName: req.user.username,
            currentPage: 'notifications',
            moment: moment,
            layout: "../views/layouts/main",
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send("Internal Server Error");
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.sendLineNotification = async (userId, message) => {
    try {
        await lineClient.pushMessage(userId, {
            type: 'text',
            text: message
        });
    } catch (error) {
        console.error('Error sending LINE notification:', error);
    }
};

exports.resendInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const originalNotification = await Notification.findById(id).populate('user').populate('space');
        if (!originalNotification) {
            return res.status(404).json({ success: false, message: 'Invitation not found' });
        }

        // Delete the old invitation
        await Notification.findByIdAndDelete(id);

        // Create a new notification indicating that the invitation has been resent
        const newNotification = new Notification({
            user: originalNotification.user._id,
            space: originalNotification.space._id,
            role: originalNotification.role,
            status: 'pending',
            type: 'invitation',
            leader: originalNotification.leader,
            message: `You have been invited to join ${originalNotification.space.SpaceName} as a ${originalNotification.role}. (Resent)`
        });
        await newNotification.save();

        // Resend the invitation (e.g., send an email or LINE message)
        const user = await User.findById(originalNotification.user._id);
        if (user && user.lineUserId) {
            const message = `You have been invited to join ${originalNotification.space.SpaceName} as a ${originalNotification.role}. (Resent)`;
            await lineClient.pushMessage(user.lineUserId, {
                type: 'text',
                text: message
            });
        }

        res.status(200).json({ success: true, message: 'Invitation resent successfully' });
    } catch (error) {
        console.error('Error resending invitation:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.cancelInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Invitation canceled successfully' });
    } catch (error) {
        console.error('Error canceling invitation:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.clearNonInvitationNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id, type: { $ne: 'invitation' } });
        res.status(200).json({ success: true, message: 'Non-invitation notifications cleared successfully' });
    } catch (error) {
        console.error('Error clearing non-invitation notifications:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};