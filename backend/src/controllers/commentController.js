const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper to verify participant access to a task
const verifyTaskAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return { task: null, project: null, isParticipant: false, isOwner: false };

  const project = await Project.findById(task.project);
  if (!project) return { task: null, project: null, isParticipant: false, isOwner: false };

  const isOwner = project.owner.equals(userId);
  const isMember = project.members.some((m) => m.equals(userId));

  return { task, project, isParticipant: isOwner || isMember, isOwner };
};

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private (Project participants)
const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const { task, isParticipant } = await verifyTaskAccess(taskId, req.user._id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task.' });
    }

    const comments = await Comment.find({ task: taskId })
      .populate('author', 'fullName email avatarUrl')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private (Project participants)
const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.',
      });
    }

    const trimmed = content.trim();
    if (trimmed.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 2000 characters.',
      });
    }

    const { task, isParticipant } = await verifyTaskAccess(taskId, req.user._id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to comment on this task.' });
    }

    const comment = await Comment.create({
      task: task._id,
      author: req.user._id,
      content: trimmed,
    });

    const populated = await Comment.findById(comment._id).populate('author', 'fullName email avatarUrl');

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment (Author or Project Owner only)
// @route   DELETE /api/comments/:commentId
// @access  Private (Comment author or Project Owner)
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const task = await Task.findById(comment.task);
    if (!task) {
      await comment.deleteOne();
      return res.status(200).json({ success: true, message: 'Comment deleted.' });
    }

    const project = await Project.findById(task.project);
    const isOwner = project && project.owner.equals(req.user._id);
    const isAuthor = comment.author.equals(req.user._id);

    if (!isOwner && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment.',
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTaskComments,
  addComment,
  deleteComment,
};
