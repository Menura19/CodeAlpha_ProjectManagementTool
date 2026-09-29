const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Global search across accessible projects and tasks
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        projects: [],
        tasks: [],
      });
    }

    const userId = req.user._id;
    const safeRegex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // 1. Find user's accessible projects
    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
    }).select('_id name description');

    const projectIds = accessibleProjects.map((p) => p._id);

    // Match projects
    const matchingProjects = accessibleProjects.filter(
      (p) => safeRegex.test(p.name) || (p.description && safeRegex.test(p.description))
    );

    // Match tasks only inside accessible projects
    const matchingTasks = await Task.find({
      project: { $in: projectIds },
      $or: [{ title: safeRegex }, { description: safeRegex }],
    })
      .populate('project', 'name _id')
      .populate('assignee', 'fullName email avatarUrl')
      .limit(10);

    return res.status(200).json({
      success: true,
      query: q.trim(),
      projects: matchingProjects.slice(0, 5),
      tasks: matchingTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
};
