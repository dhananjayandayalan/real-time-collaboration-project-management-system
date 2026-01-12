import { Router } from 'express';
import projectController from '../controllers/project.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All project routes require authentication
router.post('/', authenticateToken, projectController.createProject.bind(projectController));
router.get('/', authenticateToken, projectController.getProjects.bind(projectController));
router.get('/:id', authenticateToken, projectController.getProjectById.bind(projectController));
router.patch('/:id', authenticateToken, projectController.updateProject.bind(projectController));
router.delete('/:id', authenticateToken, projectController.deleteProject.bind(projectController));

// Project member routes
router.post('/:id/members', authenticateToken, projectController.addProjectMember.bind(projectController));
router.get('/:id/members', authenticateToken, projectController.getProjectMembers.bind(projectController));
router.patch('/:id/members/:userId', authenticateToken, projectController.updateProjectMember.bind(projectController));
router.delete('/:id/members/:userId', authenticateToken, projectController.removeProjectMember.bind(projectController));

export default router;
