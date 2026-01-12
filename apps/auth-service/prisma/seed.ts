import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Define roles
  const roles = [
    {
      name: 'ADMIN',
      description: 'Full system access with all permissions',
    },
    {
      name: 'MANAGER',
      description: 'Can manage projects and team members',
    },
    {
      name: 'DEVELOPER',
      description: 'Can create and manage tasks within assigned projects',
    },
    {
      name: 'VIEWER',
      description: 'Read-only access to projects and tasks',
    },
  ];

  // Define permissions
  const permissions = [
    // User permissions
    { name: 'user:create', resource: 'user', action: 'create', description: 'Create new users' },
    { name: 'user:read', resource: 'user', action: 'read', description: 'View user information' },
    { name: 'user:update', resource: 'user', action: 'update', description: 'Update user information' },
    { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },

    // Workspace permissions
    { name: 'workspace:create', resource: 'workspace', action: 'create', description: 'Create new workspaces' },
    { name: 'workspace:read', resource: 'workspace', action: 'read', description: 'View workspaces' },
    { name: 'workspace:update', resource: 'workspace', action: 'update', description: 'Update workspace information' },
    { name: 'workspace:delete', resource: 'workspace', action: 'delete', description: 'Delete workspaces' },

    // Project permissions
    { name: 'project:create', resource: 'project', action: 'create', description: 'Create new projects' },
    { name: 'project:read', resource: 'project', action: 'read', description: 'View projects' },
    { name: 'project:update', resource: 'project', action: 'update', description: 'Update project information' },
    { name: 'project:delete', resource: 'project', action: 'delete', description: 'Delete projects' },

    // Task permissions
    { name: 'task:create', resource: 'task', action: 'create', description: 'Create new tasks' },
    { name: 'task:read', resource: 'task', action: 'read', description: 'View tasks' },
    { name: 'task:update', resource: 'task', action: 'update', description: 'Update task information' },
    { name: 'task:delete', resource: 'task', action: 'delete', description: 'Delete tasks' },

    // Role management permissions
    { name: 'role:create', resource: 'role', action: 'create', description: 'Create new roles' },
    { name: 'role:read', resource: 'role', action: 'read', description: 'View roles' },
    { name: 'role:update', resource: 'role', action: 'update', description: 'Update roles' },
    { name: 'role:delete', resource: 'role', action: 'delete', description: 'Delete roles' },
    { name: 'role:assign', resource: 'role', action: 'assign', description: 'Assign roles to users' },
    { name: 'role:revoke', resource: 'role', action: 'revoke', description: 'Revoke roles from users' },

    // Permission management permissions
    { name: 'permission:read', resource: 'permission', action: 'read', description: 'View permissions' },
    { name: 'permission:assign', resource: 'permission', action: 'assign', description: 'Assign permissions to roles' },
    { name: 'permission:revoke', resource: 'permission', action: 'revoke', description: 'Revoke permissions from roles' },
  ];

  // Role-Permission mappings
  const rolePermissions: Record<string, string[]> = {
    ADMIN: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete',
      'project:create', 'project:read', 'project:update', 'project:delete',
      'task:create', 'task:read', 'task:update', 'task:delete',
      'role:create', 'role:read', 'role:update', 'role:delete', 'role:assign', 'role:revoke',
      'permission:read', 'permission:assign', 'permission:revoke',
    ],
    MANAGER: [
      'user:read',
      'workspace:create', 'workspace:read', 'workspace:update',
      'project:create', 'project:read', 'project:update', 'project:delete',
      'task:create', 'task:read', 'task:update', 'task:delete',
      'role:assign',
    ],
    DEVELOPER: [
      'user:read',
      'workspace:read',
      'project:read',
      'task:create', 'task:read', 'task:update',
    ],
    VIEWER: [
      'user:read',
      'workspace:read',
      'project:read',
      'task:read',
    ],
  };

  // Create permissions
  console.log('📝 Creating permissions...');
  const createdPermissions = new Map<string, string>();

  for (const permission of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    createdPermissions.set(permission.name, created.id);
    console.log(`  ✓ Created permission: ${permission.name}`);
  }

  // Create roles
  console.log('\n👥 Creating roles...');
  const createdRoles = new Map<string, string>();

  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    createdRoles.set(role.name, created.id);
    console.log(`  ✓ Created role: ${role.name}`);
  }

  // Create role-permission mappings
  console.log('\n🔗 Creating role-permission mappings...');

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const roleId = createdRoles.get(roleName);
    if (!roleId) continue;

    for (const permissionName of permissionNames) {
      const permissionId = createdPermissions.get(permissionName);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
    console.log(`  ✓ Assigned ${permissionNames.length} permissions to ${roleName}`);
  }

  // Create default admin user
  console.log('\n👤 Creating default admin user...');
  const hashedPassword = await hashPassword('Admin@123456');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@projectmgmt.com' },
    update: {},
    create: {
      email: 'admin@projectmgmt.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      isEmailVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Created admin user: admin@projectmgmt.com (password: Admin@123456)`);

  // Assign ADMIN role to admin user
  const adminRoleId = createdRoles.get('ADMIN');
  if (adminRoleId) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRoleId,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRoleId,
      },
    });
    console.log('  ✓ Assigned ADMIN role to admin user');
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\nSeeded data summary:');
  console.log(`  - ${roles.length} roles`);
  console.log(`  - ${permissions.length} permissions`);
  console.log(`  - ${Object.values(rolePermissions).flat().length} role-permission mappings`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
