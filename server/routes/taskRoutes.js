// TaskRoute.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const complaintController = require('../controllers/complaintController');
const { isLoggedIn } = require('../middleware/checkAuth');
const upload = require('../middleware/upload'); 

router.post('/addTask', isLoggedIn, taskController.addTask);
router.post('/addTask2', isLoggedIn, taskController.addTask2);
router.post('/addTask_board', isLoggedIn, taskController.addTask_board);
router.post('/addTask_list', isLoggedIn, taskController.addTask_list);
router.get('/space/item/:id', isLoggedIn, taskController.task_dashboard);
router.get('/space/item/:id/task_list', isLoggedIn, taskController.task_list);
router.get('/space/item/:id/task_board', isLoggedIn, taskController.task_board);

router.post('/task/deleteTasks/:id', isLoggedIn, taskController.deleteTasks);
router.post('/task/getSubtaskCount/:id', isLoggedIn, taskController.getSubtaskCount);

router.post('/deleteActivityLog', isLoggedIn, taskController.deleteActivityLog);
router.get('/task/:id/detail', isLoggedIn, taskController.ItemDetail);
router.get('/task/:id/pendingDetail', isLoggedIn, taskController.pendingDetail);

router.post('/updateTask', isLoggedIn, taskController.updateTask);
router.post('/updateTaskStatus', isLoggedIn, taskController.updateTaskStatus);
router.post('/updateDueDate', isLoggedIn, taskController.updateDueDate);
router.post('/updateDueTime', isLoggedIn, taskController.updateDueTime);
router.post('/updateTaskPriority',isLoggedIn, taskController.updateTaskPriority);
router.post('/updateTaskDescription',isLoggedIn, taskController.updateTaskDescription);
router.get('/space/item/:id/member', isLoggedIn, taskController.task_member);
router.get('/space/item/:id/pedding', isLoggedIn, taskController.pendingTask);

router.post('/uploadDocument/:id', upload.array('documents', 5),isLoggedIn, taskController.uploadDocument);
router.delete('/deleteFile/:id',isLoggedIn, taskController.deleteFile);

router.put('/update-role/:memberId', isLoggedIn, taskController.updateRole);
router.delete('/space/member/:memberId/delete',isLoggedIn, taskController.deleteMember);
router.post('/tasks/:id/addComment', isLoggedIn, taskController.addComment);

router.post('/users/:id/reset-password', ensureAdmin, adminController.resetPassword); 

router.get('/complaint', isLoggedIn, complaintController.ComplaintPage)

module.exports = router;