const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

// Helper to check if a user is a project participant (owner or member)
const getProjectIfParticipant = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, isParticipant: false, isOwner: false };

  const isOwner = project.owner.equals(userId);
  const isMember = project.members.some((m) => m.equals(userId));
  return { project, isParticipant: isOwner || isMember, isOwner };
};

// Helper to validate assignee belongs to project or is null
const validateAssignee = (project, assigneeId) => {
  if (!assigneeId) return true; // Unassigned is valid
  const aStr = assigneeId.toString();
  if (project.owner.toString() === aStr) return true;
  return project.members.some((m) => m.toString() === aStr);
};

// Helper to attach comment count to tasks
const attachCommentCounts = async (tasks) => {
  const taskIds = tasks.map((t) => t._id);
  const comments = await Comment.aggregate([
    { $match: { task: { $in: taskIds } } },
    { $group: { _id: '$task', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  comments.forEach((c) => {
    countMap[c._id.toString()] = c.count;
  });

  return tasks.map((task) => {
    const tObj = task.toObject ? task.toObject() : { ...task };
    tObj.commentCount = countMap[task._id.toString()] || 0;
    return tObj;
  });
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private (Owner & Members)
const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee, search } = req.query;

    const { project, isParticipant } = await getProjectIfParticipant(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project.' });
    }

    let query = { project: project._id };

    if (status && ['todo', 'in_progress', 'review', 'completed'].includes(status)) {
      query.status = status;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = priority;
    }

    if (assignee) {
      if (assignee === 'unassigned') {
        query.assignee = null;
      } else {
        query.assignee = assignee;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'fullName email avatarUrl')
      .populate('createdBy', 'fullName email avatarUrl')
      .sort({ createdAt: -1 });

    const tasksWithCounts = await attachCommentCounts(tasks);

    return res.status(200).json({
      success: true,
      count: tasksWithCounts.length,
      tasks: tasksWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task in a project
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Owner & Members)
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, assignee, dueDate, labels } = req.body;

    const { project, isParticipant } = await getProjectIfParticipant(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      return res.status(400).json({ success: false, message: 'Task title cannot exceed 200 characters.' });
    }

    // Validate status
    const taskStatus = status || 'todo';
    if (!['todo', 'in_progress', 'review', 'completed'].includes(taskStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: todo, in_progress, review, completed.',
      });
    }

    // Validate priority
    const taskPriority = priority || 'medium';
    if (!['low', 'medium', 'high'].includes(taskPriority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be one of: low, medium, high.',
      });
    }

    // Validate assignee belongs to this project
    const targetAssignee = assignee || null;
    if (targetAssignee && !validateAssignee(project, targetAssignee)) {
      return res.status(400).json({
        success: false,
        message: 'Assignee must be either the project owner or a registered member of this project.',
      });
    }

    const task = await Task.create({
      project: project._id,
      title: trimmedTitle,
      description: description ? description.trim() : '',
      status: taskStatus,
      priority: taskPriority,
      assignee: targetAssignee,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: Array.isArray(labels) ? labels.map((l) => String(l).trim()).filter(Boolean) : [],
      createdBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'fullName email avatarUrl')
      .populate('createdBy', 'fullName email avatarUrl');

    const [withCount] = await attachCommentCounts([populated]);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: withCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task details
// @route   GET /api/tasks/:taskId
// @access  Private (Project participants)
const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('assignee', 'fullName email avatarUrl')
      .populate('createdBy', 'fullName email avatarUrl')
      .populate('project', 'name _id owner members');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { isParticipant } = await getProjectIfParticipant(task.project._id, req.user._id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task.' });
    }

    const [withCount] = await attachCommentCounts([task]);

    // Check if user is owner of project or creator of task
    const isProjectOwner = task.project.owner.equals(req.user._id);
    const isTaskCreator = task.createdBy._id.equals(req.user._id);
    withCount.canDelete = isProjectOwner || isTaskCreator;
    withCount.canEdit = true; // All project participants can edit task fields

    return res.status(200).json({
      success: true,
      task: withCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task fields
// @route   PATCH /api/tasks/:taskId
// @access  Private (Project participants)
const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignee, dueDate, labels } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { project, isParticipant } = await getProjectIfParticipant(task.project, req.user._id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task.' });
    }

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Task title cannot be empty.' });
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length > 200) {
        return res.status(400).json({ success: false, message: 'Task title cannot exceed 200 characters.' });
      }
      task.title = trimmedTitle;
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (status !== undefined) {
      if (!['todo', 'in_progress', 'review', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: todo, in_progress, review, completed.',
        });
      }
      task.status = status;
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority. Must be one of: low, medium, high.',
        });
      }
      task.priority = priority;
    }

    if (assignee !== undefined) {
      const targetAssignee = assignee || null;
      if (targetAssignee && !validateAssignee(project, targetAssignee)) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be either the project owner or a member of this project.',
        });
      }
      task.assignee = targetAssignee;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (labels !== undefined) {
      task.labels = Array.isArray(labels) ? labels.map((l) => String(l).trim()).filter(Boolean) : [];
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'fullName email avatarUrl')
      .populate('createdBy', 'fullName email avatarUrl')
      .populate('project', 'name _id owner');

    const [withCount] = await attachCommentCounts([populated]);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: withCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick update status (Kanban board drag/move)
// @route   PATCH /api/tasks/:taskId/status
// @access  Private (Project participants)
const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status || !['todo', 'in_progress', 'review', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: todo, in_progress, review, completed.',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { isParticipant } = await getProjectIfParticipant(task.project, req.user._id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task.' });
    }

    task.status = status;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'fullName email avatarUrl')
      .populate('createdBy', 'fullName email avatarUrl');

    const [withCount] = await attachCommentCounts([populated]);

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully.',
      task: withCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task (Project Owner OR Task Creator only)
// @route   DELETE /api/tasks/:taskId
// @access  Private (Owner or Task Creator)
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { project, isOwner } = await getProjectIfParticipant(task.project, req.user._id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isTaskCreator = task.createdBy.equals(req.user._id);

    // Rule: ONLY project owner OR task creator can delete
    if (!isOwner && !isTaskCreator) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or the task creator can delete this task.',
      });
    }

    // Clean up task comments in MongoDB
    await Comment.deleteMany({ task: task._id });
    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Task and its comments have been deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks assigned to current user (My Tasks)
// @route   GET /api/tasks/my
// @access  Private
const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { project, status, priority, filter = 'all', search } = req.query;

    let query = { assignee: userId };

    if (project) {
      query.project = project;
    }

    if (status && ['todo', 'in_progress', 'review', 'completed'].includes(status)) {
      query.status = status;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = priority;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter === 'due_today') {
      query.status = { $ne: 'completed' };
      query.dueDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (filter === 'overdue') {
      query.status = { $ne: 'completed' };
      query.dueDate = { $lt: now };
    } else if (filter === 'completed') {
      query.status = 'completed';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$and = [
        { $or: [{ title: searchRegex }, { description: searchRegex }] }
      ];
    }

    const tasks = await Task.find(query)
      .populate('project', 'name _id owner')
      .populate('assignee', 'fullName email avatarUrl')
      .populate('createdBy', 'fullName email avatarUrl')
      .sort({ dueDate: 1, createdAt: -1 });

    const tasksWithCounts = await attachCommentCounts(tasks);

    return res.status(200).json({
      success: true,
      count: tasksWithCounts.length,
      tasks: tasksWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch reschedule tasks assigned to current user
// @route   PATCH /api/tasks/batch/reschedule
// @access  Private
const batchRescheduleTasks = async (req, res, next) => {
  try {
    const { taskIds, dueDate } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide task IDs to reschedule.' });
    }

    const dateVal = dueDate ? new Date(dueDate) : null;

    // Only allow updating tasks where the user is a participant
    await Task.updateMany(
      { _id: { $in: taskIds }, assignee: req.user._id },
      { $set: { dueDate: dateVal } }
    );

    return res.status(200).json({
      success: true,
      message: `${taskIds.length} tasks rescheduled successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch mark tasks as completed
// @route   PATCH /api/tasks/batch/complete
// @access  Private
const batchCompleteTasks = async (req, res, next) => {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide task IDs.' });
    }

    await Task.updateMany(
      { _id: { $in: taskIds }, assignee: req.user._id },
      { $set: { status: 'completed' } }
    );

    return res.status(200).json({
      success: true,
      message: 'Selected tasks marked as Completed.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getMyTasks,
  batchRescheduleTasks,
  batchCompleteTasks,
};
