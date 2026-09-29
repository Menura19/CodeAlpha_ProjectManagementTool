const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get members of a project
// @route   GET /api/projects/:projectId/members
// @access  Private (Owner & Members)
const getProjectMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { search } = req.query;

    const project = await Project.findById(projectId)
      .populate('owner', 'fullName email avatarUrl')
      .populate('members', 'fullName email avatarUrl');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Auth check: must be owner or member
    const isOwner = project.owner._id.equals(req.user._id);
    const isMember = project.members.some((m) => m._id.equals(req.user._id));

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to view members of this project.',
      });
    }

    let participants = [
      {
        ...project.owner.toObject(),
        role: 'Owner',
        isOwner: true,
      },
      ...project.members.map((m) => ({
        ...m.toObject(),
        role: 'Member',
        isOwner: false,
      })),
    ];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      participants = participants.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: participants.length,
      projectName: project.name,
      owner: project.owner,
      members: participants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project by exact email (Owner only)
// @route   POST /api/projects/:projectId/members
// @access  Private (Owner only)
const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid user email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Only owner can add members
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can add team members.',
      });
    }

    // Look up registered user
    const userToAdd = await User.findOne({ email: normalizedEmail }).select('fullName email avatarUrl');
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with that email address.',
      });
    }

    // Check if adding owner
    if (project.owner.equals(userToAdd._id)) {
      return res.status(400).json({
        success: false,
        message: 'This user is already the owner of the project.',
      });
    }

    // Check if already a member
    if (project.members.some((m) => m.equals(userToAdd._id))) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project.',
      });
    }

    project.members.push(userToAdd._id);
    await project.save();

    return res.status(200).json({
      success: true,
      message: `${userToAdd.fullName} has been added as a project member.`,
      member: {
        ...userToAdd.toObject(),
        role: 'Member',
        isOwner: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project (Owner only)
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private (Owner only)
const removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Only owner can remove members
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can remove members.',
      });
    }

    // Owner cannot remove themselves
    if (project.owner.equals(userId)) {
      return res.status(400).json({
        success: false,
        message: 'The project owner cannot be removed from the project.',
      });
    }

    // Check if user is in members array
    const memberIndex = project.members.findIndex((m) => m.equals(userId));
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project.',
      });
    }

    // Remove from members
    project.members.splice(memberIndex, 1);
    await project.save();

    // Critical requirement: Unassign this user from any tasks in this project
    await Task.updateMany(
      { project: project._id, assignee: userId },
      { $set: { assignee: null } }
    );

    return res.status(200).json({
      success: true,
      message: 'Member removed and their assigned tasks have been unassigned.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectMembers,
  addMember,
  removeMember,
};
