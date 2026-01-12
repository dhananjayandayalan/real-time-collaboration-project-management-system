import { Router } from 'express';
import roleController from '../controllers/role.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// All role routes require authentication
router.use(authenticateToken);

// Role management routes (require role:read permission)
router.get('/', requirePermission('role:read'), roleController.getAllRoles.bind(roleController));
router.get('/:id', requirePermission('role:read'), roleController.getRoleById.bind(roleController));

// Role CRUD routes (require specific permissions)
router.post('/', requirePermission('role:create'), roleController.createRole.bind(roleController));
router.patch('/:id', requirePermission('role:update'), roleController.updateRole.bind(roleController));
router.delete('/:id', requirePermission('role:delete'), roleController.deleteRole.bind(roleController));

// Role assignment routes
router.post('/assign', requirePermission('role:assign'), roleController.assignRoleToUser.bind(roleController));
router.post('/revoke', requirePermission('role:revoke'), roleController.revokeRoleFromUser.bind(roleController));

// Get users by role and roles for user
router.get('/:id/users', requirePermission('role:read'), roleController.getUsersByRole.bind(roleController));
router.get('/user/:userId', requirePermission('role:read'), roleController.getRolesForUser.bind(roleController));

export default router;