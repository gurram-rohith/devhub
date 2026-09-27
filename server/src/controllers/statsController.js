import Workspace from '../models/Workspace.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getWorkspaceStats = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const isMember = workspace.members.some((m) => m.user.equals(req.user._id));
  if (!isMember) throw new AppError('You are not a member of this workspace', 403);

  const [totalMembers, upcomingEvents, taskCounts] = await Promise.all([
    Promise.resolve(workspace.members.length), // already loaded, no extra query needed

    Event.countDocuments({ workspace: workspaceId, startTime: { $gte: new Date() } }),

    Task.aggregate([
      { $match: { workspace: workspace._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // taskCounts comes back like [{_id:'To Do', count:3}, {_id:'Completed', count:5}]
  // Reshape it into a flat, predictable object for the frontend
  const taskBreakdown = { 'To Do': 0, 'In Progress': 0, Completed: 0 };
  taskCounts.forEach((t) => { taskBreakdown[t._id] = t.count; });
  const totalTasks = taskCounts.reduce((sum, t) => sum + t.count, 0);

  res.json({
    success: true,
    stats: {
      totalMembers,
      upcomingEvents,
      tasks: { total: totalTasks, ...taskBreakdown },
    },
  });
});