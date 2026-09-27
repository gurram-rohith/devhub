import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const getMembershipOrThrow = async (workspaceId, userId, allowedRoles = []) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const membership = workspace.members.find((m) => m.user.equals(userId));
  if (!membership) throw new AppError('You are not a member of this workspace', 403);

  if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
    throw new AppError('You do not have permission to perform this action', 403);
  }
  return { workspace, membership };
};

export const createTask = asyncHandler(async (req, res) => {
  const { workspaceId, title, description, assignedTo, priority, dueDate } = req.body;

  const { workspace } = await getMembershipOrThrow(workspaceId, req.user._id, ['admin']);

  // Validate the assignee is actually a member of this workspace
  const assigneeIsMember = workspace.members.some((m) => m.user.equals(assignedTo));
  if (!assigneeIsMember) throw new AppError('Assignee must be a member of this workspace', 400);

  const task = await Task.create({
    workspace: workspaceId, title, description, assignedTo,
    assignedBy: req.user._id, priority, dueDate,
  });

  res.status(201).json({ success: true, task });
});

export const listWorkspaceTasks = asyncHandler(async (req, res) => {
  await getMembershipOrThrow(req.params.workspaceId, req.user._id); // any member

  const filter = { workspace: req.params.workspaceId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo === 'me') filter.assignedTo = req.user._id;
  else if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  const tasks = await Task.find(filter)
    .sort({ dueDate: 1 })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');

  res.json({ success: true, count: tasks.length, tasks });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['To Do', 'In Progress', 'Completed'].includes(status)) {
    throw new AppError('Invalid status value', 400);
  }

  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);

  const { membership } = await getMembershipOrThrow(task.workspace, req.user._id); // any member

  // The key rule: members can only update THEIR OWN tasks; admins can update any
  const isOwnTask = task.assignedTo.equals(req.user._id);
  if (membership.role !== 'admin' && !isOwnTask) {
    throw new AppError('You can only update tasks assigned to you', 403);
  }

  task.status = status;
  await task.save();

  res.json({ success: true, task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);

  await getMembershipOrThrow(task.workspace, req.user._id, ['admin']);

  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted' });
});