const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { isLoggedIn } = require('../middleware/checkAuth');
const userActivityLogger = require('../middleware/userActivityLogger');

router.get('/setting', isLoggedIn, userActivityLogger, settingController.setting_get);
router.post('/setting_profile/image/:id', isLoggedIn, settingController.edit_Update_profileImage);
router.post('/setting_profile/username/:id', isLoggedIn, settingController.edit_Update_username);

module.exports = router;