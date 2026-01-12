import { Router } from 'express';
import permissionController from '../controllers/permission.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// All permission routes require authentication
router.use(authenticateToken);

// Permission read routes
router.get('/', requirePermission('permission:read'), permissionController.getAllPermissions.bind(permissionController));
router.get('/:id', requirePermission('permission:read'), permissionController.getPermissionById.bind(permissionController));
router.get('/resource/:resource', requirePermission('permission:read'), permissionController.getPermissionsByResource.bind(permissionController));

// Permission-Role assignment routes
router.post('/assign', requirePermission('permission:assign'), permissionController.assignPermissionToRole.bind(permissionController));
router.post('/revoke', requirePermission('permission:revoke'), permissionController.revokePermissionFromRole.bind(permissionController));
router.post('/bulk-assign', requirePermission('permission:assign'), permissionController.bulkAssignPermissionsToRole.bind(permissionController));
router.post('/bulk-revoke', requirePermission('permission:revoke'), permissionController.bulkRevokePermissionsFromRole.bind(permissionController));

// Get permissions for role and roles for permission
router.get('/role/:roleId', requirePermission('permission:read'), permissionController.getPermissionsForRole.bind(permissionController));
router.get('/:permissionId/roles', requirePermission('permission:read'), permissionController.getRolesForPermission.bind(permissionController));

export default router;