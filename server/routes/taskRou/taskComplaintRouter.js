//taskComplaintRouter.js
const express = require('express');
const router = express.Router();
const complaintController = require('../../controllers/complaintController');
const { isLoggedIn } = require('../../middleware/checkAuth');
const upload = require('../../middleware/upload-complaint');
const userActivityLogger = require('../../middleware/userActivityLogger');

router.get('/complaint', isLoggedIn, userActivityLogger, complaintController.ComplaintPage);
router.post('/complaint', isLoggedIn, userActivityLogger, upload.array('screenshot', 3), complaintController.submitComplaint); 

router.get('/complaint/statuscomplaint', isLoggedIn, complaintController.statusComplaint);
router.get('/complaint/endupdatecomplaint', isLoggedIn, complaintController.endStatusComplaint);
router.get('/complaint/:id', isLoggedIn, complaintController.complaintDetail); 
router.post('/complaint/:id/update', isLoggedIn, complaintController.updateComplaintStatus); // เพิ่ม route

module.exports = router;