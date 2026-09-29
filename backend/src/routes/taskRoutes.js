const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

// My Tasks & Batch actions
router.get('/my', protect, taskController.getMyTasks);
router.patch('/batch/reschedule', protect, taskController.batchRescheduleTasks);
router.patch('/batch/complete', protect, taskController.batchCompleteTasks);

// Single task operations
router.get('/:taskId', protect, validateObjectId('taskId'), taskController.getTaskById);
router.patch('/:taskId', protect, validateObjectId('taskId'), taskController.updateTask);
router.patch('/:taskId/status', protect, validateObjectId('taskId'), taskController.updateTaskStatus);
router.delete('/:taskId', protect, validateObjectId('taskId'), taskController.deleteTask);

// Task comments
router.get('/:taskId/comments', protect, validateObjectId('taskId'), commentController.getTaskComments);
router.post('/:taskId/comments', protect, validateObjectId('taskId'), commentController.addComment);

module.exports = router;
