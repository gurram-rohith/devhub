import express from 'express';
import {protect} from '../middleware/auth.js';
import requireWorkspaceRole from '../middleware/workspaceAccess.js';

import { deleteWorkspace } from '../controllers/workspaceController.js';
import {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
  getWorkspaceById,
  removeMember,
} from '../controllers/workspaceController.js';

const router = express.Router();

router.use(protect); // every route below requires login

router.post('/', createWorkspace);
router.get('/', getMyWorkspaces);
router.post('/join', joinWorkspace);
router.get('/:id', requireWorkspaceRole(), getWorkspaceById);           // any member
router.delete('/:id/members/:userId', requireWorkspaceRole('admin'), removeMember); // admin only
router.delete('/:id', requireWorkspaceRole('admin'), deleteWorkspace);

export default router;