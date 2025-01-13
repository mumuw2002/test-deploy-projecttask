// server/routes/subtaskRoutes.js
const express = require('express');
const router = express.Router();
const subTaskController = require('../controllers/subtaskController');
const { isLoggedIn } = require('../middleware/checkAuth');
const userActivityLogger = require('../middleware/userActivityLogger');

// Route to add a subtask
router.post('/addSubtask', isLoggedIn, userActivityLogger, subTaskController.createSubTask);

// Route to toggle the status of a subtask
router.put('/toggleSubTaskStatus', isLoggedIn, subTaskController.toggleSubTaskStatus);
router.delete('/deleteSubtask/:id',isLoggedIn, subTaskController.deleteSubtask);
router.get('/api/subtask/:id', isLoggedIn, subTaskController.getSubtaskDetails);
router.post('/updateSubtask'),isLoggedIn, subTaskController.updateSubtask;
router.post('/updateSubtaskDescription', isLoggedIn, subTaskController.updateSubtaskDescription);

module.exports = router;
