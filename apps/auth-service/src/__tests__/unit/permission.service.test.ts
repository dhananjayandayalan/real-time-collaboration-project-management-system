import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionService } from '../../services/permission.service';
import {
  createTestRole,
  createTestPermission,
  assignPermissionToRole,
} from '../utils/testHelpers';
import { prisma } from '../setup';

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    permissionService = new PermissionService();
  });

  describe('getAllPermissions', () => {
    it('should return all permissions ordered by resource and action', async () => {
      await createTestPermission({ resource: 'user', action: 'create' });
      await createTestPermission({ resource: 'user', action: 'read' });
      await createTestPermission({ resource: 'project', action: 'create' });

      const permissions = await permissionService.getAllPermissions();

      expect(permissions).toHaveLength(3);
      expect(permissions[0]).toHaveProperty('_count');
    });

    it('should return empty array if no permissions exist', async () => {
      const permissions = await permissionService.getAllPermissions();
      expect(permissions).toEqual([]);
    });
  });

  describe('getPermissionById', () => {
    it('should return permission with roles', async () => {
      const permission = await createTestPermission();
      const role = await createTestRole();
      await assignPermissionToRole(role.id, permission.id);

      const result = await permissionService.getPermissionById(permission.id);

      expect(result.id).toBe(permission.id);
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].id).toBe(role.id);
    });

    it('should throw error if permission not found', async () => {
      await expect(
        permissionService.getPermissionById('non-existent-id')
      ).rejects.toThrow('Permission not found');
    });
  });

  describe('getPermissionsByResource', () => {
    it('should return all permissions for a resource', async () => {
      await createTestPermission({ resource: 'user', action: 'create' });
      await createTestPermission({ resource: 'user', action: 'read' });
      await createTestPermission({ resource: 'project', action: 'create' });

      const permissions = await permissionService.getPermissionsByResource('user');

      expect(permissions).toHaveLength(2);
      expect(permissions.every((p) => p.resource === 'user')).toBe(true);
    });

    it('should return empty array if no permissions for resource', async () => {
      const permissions = await permissionService.getPermissionsByResource('nonexistent');
      expect(permissions).toEqual([]);
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role successfully', async () => {
      const role = await createTestRole();
      const permission = await createTestPermission();

      const result = await permissionService.assignPermissionToRole({
        roleId: role.id,
        permissionId: permission.id,
      });

      expect(result.roleId).toBe(role.id);
      expect(result.permissionId).toBe(permission.id);
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('permission');
    });

    it('should throw error if role not found', async () => {
      const permission = await createTestPermission();

      await expect(
        permissionService.assignPermissionToRole({
          roleId: 'non-existent-id',
          permissionId: permission.id,
        })
      ).rejects.toThrow('Role not found');
    });

    it('should throw error if permission not found', async () => {
      const role = await createTestRole();

      await expect(
        permissionService.assignPermissionToRole({
          roleId: role.id,
          permissionId: 'non-existent-id',
        })
      ).rejects.toThrow('Permission not found');
    });

    it('should throw error if role already has the permission', async () => {
      const role = await createTestRole();
      const permission = await createTestPermission();

      await permissionService.assignPermissionToRole({
        roleId: role.id,
        permissionId: permission.id,
      });

      await expect(
        permissionService.assignPermissionToRole({
          roleId: role.id,
          permissionId: permission.id,
        })
      ).rejects.toThrow('Role already has this permission');
    });
  });

  describe('revokePermissionFromRole', () => {
    it('should revoke permission from role successfully', async () => {
      const role = await createTestRole();
      const permission = await createTestPermission();
      await assignPermissionToRole(role.id, permission.id);

      const result = await permissionService.revokePermissionFromRole(
        role.id,
        permission.id
      );

      expect(result.message).toBe('Permission revoked successfully');

      const assignment = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
      });
      expect(assignment).toBeNull();
    });

    it('should throw error if role does not have the permission', async () => {
      const role = await createTestRole();
      const permission = await createTestPermission();

      await expect(
        permissionService.revokePermissionFromRole(role.id, permission.id)
      ).rejects.toThrow('Role does not have this permission');
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for a role', async () => {
      const role = await createTestRole();
      const perm1 = await createTestPermission({ resource: 'user', action: 'create' });
      const perm2 = await createTestPermission({ resource: 'user', action: 'read' });

      await assignPermissionToRole(role.id, perm1.id);
      await assignPermissionToRole(role.id, perm2.id);

      const permissions = await permissionService.getPermissionsForRole(role.id);

      expect(permissions).toHaveLength(2);
    });

    it('should return empty array if role has no permissions', async () => {
      const role = await createTestRole();

      const permissions = await permissionService.getPermissionsForRole(role.id);

      expect(permissions).toEqual([]);
    });

    it('should throw error if role not found', async () => {
      await expect(
        permissionService.getPermissionsForRole('non-existent-id')
      ).rejects.toThrow('Role not found');
    });
  });

  describe('getRolesForPermission', () => {
    it('should return all roles with a permission', async () => {
      const permission = await createTestPermission();
      const role1 = await createTestRole({ name: 'ADMIN' });
      const role2 = await createTestRole({ name: 'MANAGER' });

      await assignPermissionToRole(role1.id, permission.id);
      await assignPermissionToRole(role2.id, permission.id);

      const roles = await permissionService.getRolesForPermission(permission.id);

      expect(roles).toHaveLength(2);
    });

    it('should return empty array if no roles have the permission', async () => {
      const permission = await createTestPermission();

      const roles = await permissionService.getRolesForPermission(permission.id);

      expect(roles).toEqual([]);
    });

    it('should throw error if permission not found', async () => {
      await expect(
        permissionService.getRolesForPermission('non-existent-id')
      ).rejects.toThrow('Permission not found');
    });
  });

  describe('bulkAssignPermissionsToRole', () => {
    it('should assign multiple permissions to a role', async () => {
      const role = await createTestRole();
      const perm1 = await createTestPermission({ resource: 'user', action: 'create' });
      const perm2 = await createTestPermission({ resource: 'user', action: 'read' });
      const perm3 = await createTestPermission({ resource: 'user', action: 'update' });

      const result = await permissionService.bulkAssignPermissionsToRole(
        role.id,
        [perm1.id, perm2.id, perm3.id]
      );

      expect(result.assigned).toBe(3);
      expect(result.message).toBe('Permissions assigned successfully');

      const permissions = await permissionService.getPermissionsForRole(role.id);
      expect(permissions).toHaveLength(3);
    });

    it('should skip already assigned permissions', async () => {
      const role = await createTestRole();
      const perm1 = await createTestPermission({ resource: 'user', action: 'create' });
      const perm2 = await createTestPermission({ resource: 'user', action: 'read' });

      await assignPermissionToRole(role.id, perm1.id);

      const result = await permissionService.bulkAssignPermissionsToRole(
        role.id,
        [perm1.id, perm2.id]
      );

      expect(result.assigned).toBe(1); // Only perm2 was new
    });

    it('should return appropriate message if no new permissions', async () => {
      const role = await createTestRole();
      const perm1 = await createTestPermission();

      await assignPermissionToRole(role.id, perm1.id);

      const result = await permissionService.bulkAssignPermissionsToRole(
        role.id,
        [perm1.id]
      );

      expect(result.assigned).toBe(0);
      expect(result.message).toBe('No new permissions to assign');
    });

    it('should throw error if role not found', async () => {
      const perm = await createTestPermission();

      await expect(
        permissionService.bulkAssignPermissionsToRole('non-existent-id', [perm.id])
      ).rejects.toThrow('Role not found');
    });

    it('should throw error if any permission not found', async () => {
      const role = await createTestRole();

      await expect(
        permissionService.bulkAssignPermissionsToRole(role.id, [
          'non-existent-id',
        ])
      ).rejects.toThrow('One or more permissions not found');
    });
  });

  describe('bulkRevokePermissionsFromRole', () => {
    it('should revoke multiple permissions from a role', async () => {
      const role = await createTestRole();
      const perm1 = await createTestPermission({ resource: 'user', action: 'create' });
      const perm2 = await createTestPermission({ resource: 'user', action: 'read' });
      const perm3 = await createTestPermission({ resource: 'user', action: 'update' });

      await assignPermissionToRole(role.id, perm1.id);
      await assignPermissionToRole(role.id, perm2.id);
      await assignPermissionToRole(role.id, perm3.id);

      const result = await permissionService.bulkRevokePermissionsFromRole(
        role.id,
        [perm1.id, perm2.id]
      );

      expect(result.revoked).toBe(2);
      expect(result.message).toBe('Permissions revoked successfully');

      const permissions = await permissionService.getPermissionsForRole(role.id);
      expect(permissions).toHaveLength(1);
    });

    it('should handle non-existent permission assignments gracefully', async () => {
      const role = await createTestRole();
      const perm = await createTestPermission();

      const result = await permissionService.bulkRevokePermissionsFromRole(
        role.id,
        [perm.id]
      );

      expect(result.revoked).toBe(0);
    });

    it('should throw error if role not found', async () => {
      await expect(
        permissionService.bulkRevokePermissionsFromRole('non-existent-id', [
          'any-id',
        ])
      ).rejects.toThrow('Role not found');
    });
  });
});