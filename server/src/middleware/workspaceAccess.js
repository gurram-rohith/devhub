import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// allowedRoles: e.g. ['admin'] or [] for "any member is fine"
const requireWorkspaceRole = (...allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
    if (!workspaceId) throw new AppError('Workspace ID missing from request', 400);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found', 404);

    const membership = workspace.members.find((m) => m.user.equals(req.user._id));
    if (!membership) throw new AppError('You are not a member of this workspace', 403);

    if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }

    req.workspace = workspace;    // downstream controllers reuse this — no second DB fetch
    req.membership = membership;  // controllers can check req.membership.role directly
    next();
  });

export default requireWorkspaceRole;