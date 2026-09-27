import express from 'express';
import {protect} from '../middleware/auth.js';
import {
  createTask,
  listWorkspaceTasks,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';

const router = express.Router();
router.use(protect);

router.post('/', createTask);                                  // body: { workspaceId, ... }
router.get('/workspace/:workspaceId', listWorkspaceTasks);      // ?status=&assignedTo=me
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;