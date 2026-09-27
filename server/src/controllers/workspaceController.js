import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';

export const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }], // creator becomes admin
  });

  res.status(201).json({ success: true, workspace });
});

export const getMyWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({ 'members.user': req.user._id })
    .select('name description inviteCode owner members createdAt');

  res.json({ success: true, count: workspaces.length, workspaces });
});

export const joinWorkspace = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) throw new AppError('Invite code is required', 400);

  const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() });
  if (!workspace) throw new AppError('Invalid invite code', 404);

  const alreadyMember = workspace.members.some((m) => m.user.equals(req.user._id));
  if (alreadyMember) throw new AppError('You are already a member of this workspace', 409);

  workspace.members.push({ user: req.user._id, role: 'member' });
  await workspace.save();

  res.json({ success: true, workspace });
});

// req.workspace already loaded and permission already checked by requireWorkspaceRole
export const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await req.workspace.populate('members.user', 'name email');
  res.json({ success: true, workspace });
});
export const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = req.workspace; // already loaded by requireWorkspaceRole

  await Promise.all([
    Event.deleteMany({ workspace: workspace._id }),
    Task.deleteMany({ workspace: workspace._id }),
  ]);
  await workspace.deleteOne();

  res.json({ success: true, message: 'Workspace and all its data deleted' });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const workspace = req.workspace;

  if (workspace.owner.equals(userId)) {
    throw new AppError('Cannot remove the workspace owner', 400);
  }

  const before = workspace.members.length;
  workspace.members = workspace.members.filter((m) => !m.user.equals(userId));
  if (workspace.members.length === before) {
    throw new AppError('User is not a member of this workspace', 404);
  }

  await workspace.save();
  // Note: cleaning up this user's RSVPs/tasks happens in the Event/Task step later
  res.json({ success: true, message: 'Member removed' });
});