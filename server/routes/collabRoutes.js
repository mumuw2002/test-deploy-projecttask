const express = require('express');
const router = express.Router();
const collabController = require('../controllers/collabController');
const notiController = require('../controllers/notiController');
const { isLoggedIn } = require('../middleware/checkAuth');
const userActivityLogger = require('../middleware/userActivityLogger');

router.get('/space/item/:id/member', userActivityLogger, isLoggedIn, collabController.manage_Member);
router.post('/add-member', isLoggedIn, userActivityLogger, collabController.addMemberToSpace);

router.get('/search-member', isLoggedIn, collabController.searchMembers);

router.put('/update-role/:memberId', isLoggedIn, collabController.updateRole);
router.delete('/space/member/:memberId/delete', isLoggedIn, collabController.deleteMember);

router.post('/notifications/respond', isLoggedIn, collabController.respondToInvitation);

module.exports = router;