import { Router } from 'express';
import workspaceController from '../controllers/workspace.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All workspace routes require authentication
router.post('/', authenticateToken, workspaceController.createWorkspace.bind(workspaceController));
router.get('/', authenticateToken, workspaceController.getWorkspaces.bind(workspaceController));
router.get('/:id', authenticateToken, workspaceController.getWorkspaceById.bind(workspaceController));
router.patch('/:id', authenticateToken, workspaceController.updateWorkspace.bind(workspaceController));
router.delete('/:id', authenticateToken, workspaceController.deleteWorkspace.bind(workspaceController));

export default router;
