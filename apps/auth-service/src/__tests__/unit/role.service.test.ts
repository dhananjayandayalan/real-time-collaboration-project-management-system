import { describe, it, expect, beforeEach } from 'vitest';
import { RoleService } from '../../services/role.service';
import {
  createTestUser,
  createTestRole,
  createTestPermission,
  assignPermissionToRole,
  assignRoleToUser,
} from '../utils/testHelpers';
import { prisma } from '../setup';

describe('RoleService', () => {
  let roleService: RoleService;

  beforeEach(() => {
    roleService = new RoleService();
  });

  describe('getAllRoles', () => {
    it('should return all roles with permissions count', async () => {
      await createTestRole({ name: 'ADMIN' });
      await createTestRole({ name: 'USER' });

      const roles = await roleService.getAllRoles();

      expect(roles).toHaveLength(2);
      expect(roles[0]).toHaveProperty('_count');
      expect(roles[0]).toHaveProperty('rolePermissions');
    });

    it('should return empty array if no roles exist', async () => {
      const roles = await roleService.getAllRoles();
      expect(roles).toEqual([]);
    });
  });

  describe('getRoleById', () => {
    it('should return role with permissions and users', async () => {
      const role = await createTestRole();
      const permission = await createTestPermission();
      await assignPermissionToRole(role.id, permission.id);

      const user = await createTestUser();
      await assignRoleToUser(user.id, role.id);

      const result = await roleService.getRoleById(role.id);

      expect(result.id).toBe(role.id);
      expect(result.permissions).toHaveLength(1);
      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(user.id);
    });

    it('should throw error if role not found', async () => {
      await expect(
        roleService.getRoleById('non-existent-id')
      ).rejects.toThrow('Role not found');
    });
  });

  describe('getRoleByName', () => {
    it('should return role by name', async () => {
      const role = await createTestRole({ name: 'MANAGER' });

      const result = await roleService.getRoleByName('MANAGER');

      expect(result.id).toBe(role.id);
      expect(result.name).toBe('MANAGER');
    });

    it('should throw error if role not found', async () => {
      await expect(
        roleService.getRoleByName('NON_EXISTENT')
      ).rejects.toThrow('Role not found');
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const roleData = {
        name: 'NEW_ROLE',
        description: 'A new test role',
      };

      const result = await roleService.createRole(roleData);

      expect(result.name).toBe(roleData.name);
      expect(result.description).toBe(roleData.description);
      expect(result).toHaveProperty('id');
    });

    it('should throw error if role name already exists', async () => {
      await createTestRole({ name: 'DUPLICATE' });

      await expect(
        roleService.createRole({ name: 'DUPLICATE' })
      ).rejects.toThrow('Role with this name already exists');
    });
  });

  describe('updateRole', () => {
    it('should update role name', async () => {
      const role = await createTestRole({ name: 'OLD_NAME' });

      const result = await roleService.updateRole(role.id, {
        name: 'NEW_NAME',
      });

      expect(result.name).toBe('NEW_NAME');
    });

    it('should update role description', async () => {
      const role = await createTestRole();

      const result = await roleService.updateRole(role.id, {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
    });

    it('should throw error if role not found', async () => {
      await expect(
        roleService.updateRole('non-existent-id', { name: 'NEW' })
      ).rejects.toThrow('Role not found');
    });

    it('should throw error if new name already exists', async () => {
      await createTestRole({ name: 'EXISTING' });
      const role = await createTestRole({ name: 'TO_UPDATE' });

      await expect(
        roleService.updateRole(role.id, { name: 'EXISTING' })
      ).rejects.toThrow('Role with this name already exists');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const role = await createTestRole();

      const result = await roleService.deleteRole(role.id);

      expect(result.message).toBe('Role deleted successfully');

      const deletedRole = await prisma.role.findUnique({
        where: { id: role.id },
      });
      expect(deletedRole).toBeNull();
    });

    it('should throw error if role not found', async () => {
      await expect(
        roleService.deleteRole('non-existent-id')
      ).rejects.toThrow('Role not found');
    });

    it('should throw error if role is assigned to users', async () => {
      const role = await createTestRole();
      const user = await createTestUser();
      await assignRoleToUser(user.id, role.id);

      await expect(roleService.deleteRole(role.id)).rejects.toThrow(
        'Cannot delete role. It is currently assigned to 1 user(s)'
      );
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      const user = await createTestUser();
      const role = await createTestRole();

      const result = await roleService.assignRoleToUser({
        userId: user.id,
        roleId: role.id,
      });

      expect(result.userId).toBe(user.id);
      expect(result.roleId).toBe(role.id);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('role');
    });

    it('should track who assigned the role', async () => {
      const user = await createTestUser();
      const role = await createTestRole();
      const admin = await createTestUser({ email: 'admin@test.com' });

      const result = await roleService.assignRoleToUser({
        userId: user.id,
        roleId: role.id,
        assignedBy: admin.id,
      });

      expect(result.assignedBy).toBe(admin.id);
    });

    it('should throw error if user not found', async () => {
      const role = await createTestRole();

      await expect(
        roleService.assignRoleToUser({
          userId: 'non-existent-id',
          roleId: role.id,
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if role not found', async () => {
      const user = await createTestUser();

      await expect(
        roleService.assignRoleToUser({
          userId: user.id,
          roleId: 'non-existent-id',
        })
      ).rejects.toThrow('Role not found');
    });

    it('should throw error if user already has the role', async () => {
      const user = await createTestUser();
      const role = await createTestRole();

      await roleService.assignRoleToUser({
        userId: user.id,
        roleId: role.id,
      });

      await expect(
        roleService.assignRoleToUser({
          userId: user.id,
          roleId: role.id,
        })
      ).rejects.toThrow('User already has this role');
    });
  });

  describe('revokeRoleFromUser', () => {
    it('should revoke role from user successfully', async () => {
      const user = await createTestUser();
      const role = await createTestRole();
      await assignRoleToUser(user.id, role.id);

      const result = await roleService.revokeRoleFromUser(user.id, role.id);

      expect(result.message).toBe('Role revoked successfully');

      const assignment = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
      });
      expect(assignment).toBeNull();
    });

    it('should throw error if user does not have the role', async () => {
      const user = await createTestUser();
      const role = await createTestRole();

      await expect(
        roleService.revokeRoleFromUser(user.id, role.id)
      ).rejects.toThrow('User does not have this role');
    });
  });

  describe('getUsersByRole', () => {
    it('should return all users with a specific role', async () => {
      const role = await createTestRole();
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await assignRoleToUser(user1.id, role.id);
      await assignRoleToUser(user2.id, role.id);

      const users = await roleService.getUsersByRole(role.id);

      expect(users).toHaveLength(2);
      expect(users[0]).toHaveProperty('assignedAt');
    });

    it('should return empty array if no users have the role', async () => {
      const role = await createTestRole();

      const users = await roleService.getUsersByRole(role.id);

      expect(users).toEqual([]);
    });

    it('should throw error if role not found', async () => {
      await expect(
        roleService.getUsersByRole('non-existent-id')
      ).rejects.toThrow('Role not found');
    });
  });

  describe('getRolesForUser', () => {
    it('should return all roles for a user', async () => {
      const user = await createTestUser();
      const role1 = await createTestRole({ name: 'ADMIN' });
      const role2 = await createTestRole({ name: 'MANAGER' });

      await assignRoleToUser(user.id, role1.id);
      await assignRoleToUser(user.id, role2.id);

      const roles = await roleService.getRolesForUser(user.id);

      expect(roles).toHaveLength(2);
      expect(roles[0]).toHaveProperty('assignedAt');
      expect(roles[0]).toHaveProperty('permissions');
    });

    it('should return empty array if user has no roles', async () => {
      const user = await createTestUser();

      const roles = await roleService.getRolesForUser(user.id);

      expect(roles).toEqual([]);
    });
  });
});