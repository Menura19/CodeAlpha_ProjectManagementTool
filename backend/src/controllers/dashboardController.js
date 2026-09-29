const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');

// @desc    Get dashboard metrics & aggregated activity
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. User's projects (owned or joined)
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    const projectIds = userProjects.map((p) => p._id);
    const myProjectsCount = userProjects.length;

    // 2. My Open Tasks (assigned, not completed)
    const myOpenTasksCount = await Task.countDocuments({
      assignee: userId,
      status: { $ne: 'completed' },
    });

    // 3. Overdue count (assigned, not completed, dueDate < now)
    const overdueCount = await Task.countDocuments({
      assignee: userId,
      status: { $ne: 'completed' },
      dueDate: { $ne: null, $lt: now },
    });

    // 4. Due This Week count (assigned, not completed, now <= dueDate <= next 7 days)
    const dueThisWeekCount = await Task.countDocuments({
      assignee: userId,
      status: { $ne: 'completed' },
      dueDate: { $gte: now, $lte: next7Days },
    });

    // 5. Calculate project progress for each project
    const allProjectTasks = await Task.find({ project: { $in: projectIds } }).select('project status');
    const taskCountMap = {};
    const completedMap = {};

    allProjectTasks.forEach((t) => {
      const pId = t.project.toString();
      taskCountMap[pId] = (taskCountMap[pId] || 0) + 1;
      if (t.status === 'completed') {
        completedMap[pId] = (completedMap[pId] || 0) + 1;
      }
    });

    const projectProgressList = userProjects.slice(0, 6).map((project) => {
      const total = taskCountMap[project._id.toString()] || 0;
      const completed = completedMap[project._id.toString()] || 0;
      const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
      return {
        _id: project._id,
        name: project.name,
        description: project.description,
        taskCount: total,
        completedTaskCount: completed,
        progress,
        dueDate: project.dueDate,
        isOwner: project.owner.equals(userId),
      };
    });

    // 6. Tasks Due Soon (assigned to current user, not completed, sorted by due date)
    const tasksDueSoon = await Task.find({
      assignee: userId,
      status: { $ne: 'completed' },
      dueDate: { $ne: null },
    })
      .populate('project', 'name _id')
      .sort({ dueDate: 1 })
      .limit(5);

    // 7. Recent task activity across user's accessible projects
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name _id')
      .populate('createdBy', 'fullName email avatarUrl')
      .populate('assignee', 'fullName email avatarUrl')
      .sort({ updatedAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        myProjectsCount,
        myOpenTasksCount,
        overdueCount,
        dueThisWeekCount,
      },
      projectProgress: projectProgressList,
      tasksDueSoon,
      recentActivity: recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
