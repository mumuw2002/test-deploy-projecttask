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

router.get('/ReportUserProblem/updateReportUserProblem', ensureAdmin, adminController.updateReportUserProblem);
router.get('/ReportUserProblem/:id', ensureAdmin, adminController.updateReportUserProblem); 

router.get('/users/:id/edit', ensureAdmin, adminController.editUser); 
router.post('/users/:id/edit', ensureAdmin, adminController.updateUser);

router.delete('/users/:id/delete', ensureAdmin, adminController.deleteUser); 

router.get("/logout", adminController.logout);

module.exports = router;
