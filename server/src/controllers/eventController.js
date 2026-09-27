import Event from '../models/Event.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Shared helper: load a workspace and confirm the user belongs to it (and optional role)
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

export const createEvent = asyncHandler(async (req, res) => {
  const { workspaceId, title, description, startTime, endTime, location, meetingUrl, maxCapacity, tags } = req.body;

  await getMembershipOrThrow(workspaceId, req.user._id, ['admin']);

  const event = await Event.create({
    workspace: workspaceId, title, description, startTime, endTime, location, meetingUrl, maxCapacity,
    tags, createdBy: req.user._id,
  });

  res.status(201).json({ success: true, event });
});

export const listWorkspaceEvents = asyncHandler(async (req, res) => {
  await getMembershipOrThrow(req.params.workspaceId, req.user._id); // any member

  const events = await Event.find({ workspace: req.params.workspaceId })
    .sort({ date: 1 })
    .populate('createdBy', 'name email');

  res.json({ success: true, count: events.length, events });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError('Event not found', 404);

  await getMembershipOrThrow(event.workspace, req.user._id, ['admin']); // load workspace via event

  await event.deleteOne();
  res.json({ success: true, message: 'Event deleted' });
});

// ---- The standout logic ----

export const rsvpEvent = asyncHandler(async (req, res) => {
  const eventDoc = await Event.findById(req.params.id);
  if (!eventDoc) throw new AppError('Event not found', 404);

  await getMembershipOrThrow(eventDoc.workspace, req.user._id); // any member can RSVP

  // Atomic: the DB checks "not already in, and room available" and writes in ONE operation.
  // No other request can slip in between the check and the write.
  const updated = await Event.findOneAndUpdate(
    {
      _id: req.params.id,
      attendees: { $ne: req.user._id },
      $expr: { $lt: [{ $size: '$attendees' }, '$maxCapacity'] },
    },
    { $addToSet: { attendees: req.user._id } },
    { new: true }
  );

  if (!updated) {
    // Something failed — figure out which, for a helpful error message
    const fresh = await Event.findById(req.params.id);
    if (fresh.attendees.some((a) => a.equals(req.user._id))) {
      throw new AppError('You have already RSVPed to this event', 409);
    }
    throw new AppError('This event is full', 409);
  }

  res.json({ success: true, event: updated });
});

export const cancelRsvp = asyncHandler(async (req, res) => {
  const eventDoc = await Event.findById(req.params.id);
  if (!eventDoc) throw new AppError('Event not found', 404);

  await getMembershipOrThrow(eventDoc.workspace, req.user._id);

  const updated = await Event.findByIdAndUpdate(
    req.params.id,
    { $pull: { attendees: req.user._id } },
    { new: true }
  );

  res.json({ success: true, event: updated });
});