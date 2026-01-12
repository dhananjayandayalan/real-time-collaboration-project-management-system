import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TestRole {
  id: string;
  name: string;
  description?: string;
}

export interface TestPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

/**
 * Create a test user
 */
export async function createTestUser(data?: Partial<TestUser>) {
  const userData = {
    email: data?.email || 'test@example.com',
    password: await hashPassword(data?.password || 'Test@123456'),
    firstName: data?.firstName || 'Test',
    lastName: data?.lastName || 'User',
    isEmailVerified: true,
    status: 'ACTIVE' as const,
  };

  return await prisma.user.create({
    data: userData,
  });
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      email: `test${i}@example.com`,
      firstName: `Test${i}`,
      lastName: `User${i}`,
    });
    users.push(user);
  }
  return users;
}

/**
 * Create a test role
 */
export async function createTestRole(data?: Partial<TestRole>) {
  return await prisma.role.create({
    data: {
      name: data?.name || 'TEST_ROLE',
      description: data?.description || 'Test role description',
    },
  });
}

/**
 * Create multiple test roles
 */
export async function createTestRoles() {
  const roles = await Promise.all([
    prisma.role.create({
      data: { name: 'ADMIN', description: 'Administrator role' },
    }),
    prisma.role.create({
      data: { name: 'MANAGER', description: 'Manager role' },
    }),
    prisma.role.create({
      data: { name: 'DEVELOPER', description: 'Developer role' },
    }),
    prisma.role.create({
      data: { name: 'VIEWER', description: 'Viewer role' },
    }),
  ]);

  return {
    admin: roles[0],
    manager: roles[1],
    developer: roles[2],
    viewer: roles[3],
  };
}

/**
 * Create a test permission
 */
export async function createTestPermission(data?: Partial<TestPermission>) {
  const resource = data?.resource || 'test';
  const action = data?.action || 'read';

  return await prisma.permission.create({
    data: {
      name: data?.name || `${resource}:${action}`,
      resource,
      action,
      description: `${action} ${resource}`,
    },
  });
}

/**
 * Create multiple test permissions
 */
export async function createTestPermissions() {
  const permissions = await Promise.all([
    createTestPermission({ name: 'user:create', resource: 'user', action: 'create' }),
    createTestPermission({ name: 'user:read', resource: 'user', action: 'read' }),
    createTestPermission({ name: 'user:update', resource: 'user', action: 'update' }),
    createTestPermission({ name: 'user:delete', resource: 'user', action: 'delete' }),
    createTestPermission({ name: 'project:create', resource: 'project', action: 'create' }),
    createTestPermission({ name: 'project:read', resource: 'project', action: 'read' }),
    createTestPermission({ name: 'role:read', resource: 'role', action: 'read' }),
    createTestPermission({ name: 'role:assign', resource: 'role', action: 'assign' }),
  ]);

  return permissions;
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(userId: string, roleId: string) {
  return await prisma.userRole.create({
    data: {
      userId,
      roleId,
    },
  });
}

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(roleId: string, permissionId: string) {
  return await prisma.rolePermission.create({
    data: {
      roleId,
      permissionId,
    },
  });
}

/**
 * Generate authentication tokens for a user
 */
export function generateTokensForUser(userId: string, email: string) {
  return {
    accessToken: generateAccessToken({ userId, email }),
    refreshToken: generateRefreshToken({ userId, email }),
  };
}

/**
 * Create a user with a specific role
 */
export async function createUserWithRole(roleName: string, email?: string) {
  const user = await createTestUser({ email });
  const role = await createTestRole({ name: roleName });
  await assignRoleToUser(user.id, role.id);

  return { user, role };
}

/**
 * Create a role with specific permissions
 */
export async function createRoleWithPermissions(
  roleName: string,
  permissionNames: string[]
) {
  const role = await createTestRole({ name: roleName });

  const permissions = await Promise.all(
    permissionNames.map((name) => {
      const [resource, action] = name.split(':');
      return createTestPermission({ name, resource, action });
    })
  );

  await Promise.all(
    permissions.map((permission) =>
      assignPermissionToRole(role.id, permission.id)
    )
  );

  return { role, permissions };
}

/**
 * Create a complete test setup with users, roles, and permissions
 */
export async function createCompleteTestSetup() {
  // Create permissions
  const permissions = await createTestPermissions();

  // Create roles
  const roles = await createTestRoles();

  // Assign permissions to admin role
  await Promise.all(
    permissions.map((permission) =>
      assignPermissionToRole(roles.admin.id, permission.id)
    )
  );

  // Create users
  const adminUser = await createTestUser({ email: 'admin@test.com' });
  const managerUser = await createTestUser({ email: 'manager@test.com' });
  const developerUser = await createTestUser({ email: 'developer@test.com' });
  const viewerUser = await createTestUser({ email: 'viewer@test.com' });

  // Assign roles to users
  await assignRoleToUser(adminUser.id, roles.admin.id);
  await assignRoleToUser(managerUser.id, roles.manager.id);
  await assignRoleToUser(developerUser.id, roles.developer.id);
  await assignRoleToUser(viewerUser.id, roles.viewer.id);

  return {
    permissions,
    roles,
    users: {
      admin: adminUser,
      manager: managerUser,
      developer: developerUser,
      viewer: viewerUser,
    },
  };
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}