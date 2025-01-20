//adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userActivityLogger = require('../middleware/userActivityLogger');

const ensureAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
      req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      return res.redirect('/login');
  }
  next();
};

router.get('/adminPage', ensureAdmin, userActivityLogger, adminController.adminPage); 
router.get('/SystemAnnouncements', ensureAdmin, userActivityLogger, adminController.SystemAnnouncements);
router.get('/ReportUserProblem', ensureAdmin, adminController.ReportUserProblem);
router.get('/UserAccountManagement', ensureAdmin, adminController.UserAccountManagement);
router.get('/SettingAdmin', ensureAdmin, adminController.SettingAdmin);

router.get('/SystemAnnouncements/pageaddAnnouncements', ensureAdmin, adminController.pageaddAnnouncements);
router.post('/SystemAnnouncements/pageaddAnnouncements/createAnnouncements', ensureAdmin, adminController.createAnnouncements);
router.delete('/SystemAnnouncements/delete-announcement/:id', adminController.deleteAnnouncement);
router.get('/SystemAnnouncements/historySystemAnnouncements', adminController.historySystemAnnouncements);

router.post('/SettingAdmin/updateProfileImage', ensureAdmin, adminController.updateProfileImage);
router.post('/SettingAdmin/changePassword', ensureAdmin, adminController.changePassword);
router.get('/SettingAdmin/loginHistory', ensureAdmin, adminController.getLoginHistory);

router.get('/ReportUserProblem/updateReportUserProblem', ensureAdmin, adminController.updateReportUserProblem);
router.get('/ReportUserProblem/ClosedReportUserProblem', ensureAdmin, adminController.ClosedReportUserProblem);
router.get('/ReportUserProblem/closed', ensureAdmin, adminController.ClosedReportUserProblem);

router.get('/ReportUserProblem/:id', ensureAdmin, adminController.updateReportUserProblem); 

router.put('/userAccountManagement/updateusersmanage', ensureAdmin, adminController.updateusersmanage);
router.post('/admin/userAccountManagement/reset-password/:id', adminController.resetPassword); 

router.get('/reset-password-new-get', adminController.showResetPasswordNew);
router.post('/reset-password-new', adminController.resetPasswordNew); // เพิ่ม route นี้

router.get("/logout", ensureAdmin, adminController.logout);

module.exports = router;
