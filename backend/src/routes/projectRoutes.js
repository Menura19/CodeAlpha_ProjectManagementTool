const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const memberController = require('../controllers/memberController');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

// Projects CRUD
router.get('/', protect, projectController.getProjects);
router.post('/', protect, projectController.createProject);
router.get('/:projectId', protect, validateObjectId('projectId'), projectController.getProjectById);
router.patch('/:projectId', protect, validateObjectId('projectId'), projectController.updateProject);
router.delete('/:projectId', protect, validateObjectId('projectId'), projectController.deleteProject);

// Project Members
router.get('/:projectId/members', protect, validateObjectId('projectId'), memberController.getProjectMembers);
router.post('/:projectId/members', protect, validateObjectId('projectId'), memberController.addMember);
router.delete('/:projectId/members/:userId', protect, validateObjectId('projectId', 'userId'), memberController.removeMember);

// Project Tasks
router.get('/:projectId/tasks', protect, validateObjectId('projectId'), taskController.getProjectTasks);
router.post('/:projectId/tasks', protect, validateObjectId('projectId'), taskController.createTask);

module.exports = router;
