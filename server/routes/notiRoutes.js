const express = require('express');
const router = express.Router();
const notiController = require('../controllers/notiController');
const { isLoggedIn } = require('../middleware/checkAuth');
const userActivityLogger = require('../middleware/userActivityLogger');

// New route to render the notification page
router.get('/notifications', userActivityLogger, isLoggedIn, notiController.getNotifications);

// Route to clear non-invitation notifications
router.delete('/notifications/clear-non-invitation', isLoggedIn, notiController.clearNonInvitationNotifications);

// Route to delete a notification
router.delete('/notifications/:id', isLoggedIn, notiController.deleteNotification);

router.post('/notifications/resend/:id', isLoggedIn, notiController.resendInvitation);
router.delete('/notifications/cancel/:id', isLoggedIn, notiController.cancelInvitation);

module.exports = router;