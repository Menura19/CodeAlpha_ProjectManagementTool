const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');

// Helper to compute progress for a set of projects
const attachProjectMetrics = async (projects) => {
  const projectIds = projects.map((p) => p._id);
  const tasks = await Task.find({ project: { $in: projectIds } }).select('project status');

  const taskCountMap = {};
  const completedMap = {};

  tasks.forEach((t) => {
    const pId = t.project.toString();
    taskCountMap[pId] = (taskCountMap[pId] || 0) + 1;
    if (t.status === 'completed') {
      completedMap[pId] = (completedMap[pId] || 0) + 1;
    }
  });

  return projects.map((project) => {
    const pObj = project.toObject ? project.toObject() : { ...project };
    const total = taskCountMap[project._id.toString()] || 0;
    const completed = completedMap[project._id.toString()] || 0;
    pObj.taskCount = total;
    pObj.completedTaskCount = completed;
    pObj.progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return pObj;
  });
};

// @desc    Get user's projects with filtering and search
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const { filter = 'all', search } = req.query;
    const userId = req.user._id;

    let query = {};

    if (filter === 'owned') {
      query.owner = userId;
    } else if (filter === 'joined') {
      query.members = userId;
    } else {
      query.$or = [{ owner: userId }, { members: userId }];
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$and = [
        query.$or ? { $or: query.$or } : query.owner ? { owner: query.owner } : { members: query.members },
        {
          $or: [{ name: searchRegex }, { description: searchRegex }],
        },
      ];
      delete query.owner;
      delete query.members;
    }

    const projects = await Project.find(query)
      .populate('owner', 'fullName email avatarUrl')
      .populate('members', 'fullName email avatarUrl')
      .sort({ createdAt: -1 });

    const projectsWithMetrics = await attachProjectMetrics(projects);

    return res.status(200).json({
      success: true,
      count: projectsWithMetrics.length,
      projects: projectsWithMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { name, description, dueDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required.',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Project name must be between 2 and 100 characters.',
      });
    }

    const project = await Project.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      owner: req.user._id,
      members: [], // Creator is owner; not duplicated in members
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'fullName email avatarUrl')
      .populate('members', 'fullName email avatarUrl');

    const [withMetrics] = await attachProjectMetrics([populatedProject]);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project: withMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:projectId
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('owner', 'fullName email avatarUrl')
      .populate('members', 'fullName email avatarUrl');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Authorization check: User must be owner or a member
    const isOwner = project.owner._id.equals(req.user._id);
    const isMember = project.members.some((m) => m._id.equals(req.user._id));

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project.',
      });
    }

    const [withMetrics] = await attachProjectMetrics([project]);
    withMetrics.isOwner = isOwner;

    return res.status(200).json({
      success: true,
      project: withMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project (Owner only)
// @route   PATCH /api/projects/:projectId
// @access  Private (Owner only)
const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Only owner may update
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can update project details.',
      });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project name cannot be empty.',
        });
      }
      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Project name must be between 2 and 100 characters.',
        });
      }
      project.name = trimmedName;
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    if (dueDate !== undefined) {
      project.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'fullName email avatarUrl')
      .populate('members', 'fullName email avatarUrl');

    const [withMetrics] = await attachProjectMetrics([updated]);

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project: withMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project (Owner only) & cascading cleanup
// @route   DELETE /api/projects/:projectId
// @access  Private (Owner only)
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Only owner may delete
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can delete this project.',
      });
    }

    // Cascading cleanup: delete comments of all tasks, delete all tasks, delete project
    const tasks = await Task.find({ project: project._id }).select('_id');
    const taskIds = tasks.map((t) => t._id);

    if (taskIds.length > 0) {
      await Comment.deleteMany({ task: { $in: taskIds } });
      await Task.deleteMany({ project: project._id });
    }

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Project and all associated tasks and comments have been deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
};
