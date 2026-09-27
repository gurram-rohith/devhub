import express from 'express';
import {protect} from '../middleware/auth.js';
import { getWorkspaceStats } from '../controllers/statsController.js';

const router = express.Router();
router.get('/:workspaceId/stats', protect, getWorkspaceStats);

export default router;