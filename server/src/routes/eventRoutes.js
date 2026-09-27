import express from 'express';
import {protect} from '../middleware/auth.js';
import {
  createEvent,
  listWorkspaceEvents,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
} from '../controllers/eventController.js';

const router = express.Router();
router.use(protect);

router.post('/', createEvent);                                     // body: { workspaceId, ... }
router.get('/workspace/:workspaceId', listWorkspaceEvents);
router.delete('/:id', deleteEvent);
router.post('/:id/rsvp', rsvpEvent);
router.delete('/:id/rsvp', cancelRsvp);

export default router;