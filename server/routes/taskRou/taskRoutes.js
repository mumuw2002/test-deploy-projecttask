// TaskRoute.js
const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/taskCon/taskController.js');
const { isLoggedIn } = require('../../middleware/checkAuth');
const userActivityLogger = require('../../middleware/userActivityLogger');

router.post('/addTask', isLoggedIn, userActivityLogger, taskController.addTask);
router.post('/addTask2', isLoggedIn, userActivityLogger, taskController.addTask2);
router.post('/addTask_board', isLoggedIn, taskController.addTask_board);
router.post('/addTask_list', isLoggedIn, taskController.addTask_list);

router.post('/task/deleteTasks/:id', isLoggedIn, taskController.deleteTasks);
router.post('/task/getSubtaskCount/:id', isLoggedIn, taskController.getSubtaskCount);
router.get('/task/:id/pendingDetail', isLoggedIn, taskController.pendingDetail);

router.post('/updateTaskDescription',isLoggedIn, taskController.updateTaskDescription);
router.get('/space/item/:id/pedding', isLoggedIn, taskController.pendingTask);

router.delete('/deleteFile/:id',isLoggedIn, taskController.deleteFile);

router.post('/tasks/:id/addComment', isLoggedIn, taskController.addComment);

module.exports = router;