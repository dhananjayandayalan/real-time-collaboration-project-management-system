import prisma from '../config/prisma';

export interface AssignPermissionToRoleData {
  roleId: string;
  permissionId: string;
}

export class PermissionService {
  // Get all permissions
  async getAllPermissions() {
    return await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [
        {
          resource: 'asc',
        },
        {
          action: 'asc',
        },
      ],
    });
  }

  // Get permission by ID
  async getPermissionById(permissionId: string) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    return {
      ...permission,
      roles: permission.rolePermissions.map((rp) => rp.role),
      rolePermissions: undefined,
    };
  }

  // Get permissions by resource
  async getPermissionsByResource(resource: string) {
    return await prisma.permission.findMany({
      where: { resource },
      orderBy: {
        action: 'asc',
      },
    });
  }

  // Assign permission to role
  async assignPermissionToRole(data: AssignPermissionToRoleData) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: data.permissionId },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Check if role already has this permission
    const existingAssignment = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: data.roleId,
          permissionId: data.permissionId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error('Role already has this permission');
    }

    return await prisma.rolePermission.create({
      data: {
        roleId: data.roleId,
        permissionId: data.permissionId,
      },
      include: {
        role: true,
        permission: true,
      },
    });
  }

  // Revoke permission from role
  async revokePermissionFromRole(roleId: string, permissionId: string) {
    // Check if assignment exists
    const assignment = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!assignment) {
      throw new Error('Role does not have this permission');
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return { message: 'Permission revoked successfully' };
  }

  // Get permissions for a role
  async getPermissionsForRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.rolePermissions.map((rp) => rp.permission);
  }

  // Get roles that have a permission
  async getRolesForPermission(permissionId: string) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    return permission.rolePermissions.map((rp) => rp.role);
  }

  // Bulk assign permissions to role
  async bulkAssignPermissionsToRole(roleId: string, permissionIds: string[]) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Get existing permissions for this role
    const existingPermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    const existingPermissionIds = existingPermissions.map((rp) => rp.permissionId);

    // Filter out permissions that are already assigned
    const newPermissionIds = permissionIds.filter(
      (id) => !existingPermissionIds.includes(id)
    );

    if (newPermissionIds.length === 0) {
      return { message: 'No new permissions to assign', assigned: 0 };
    }

    // Verify all permissions exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: {
          in: newPermissionIds,
        },
      },
    });

    if (permissions.length !== newPermissionIds.length) {
      throw new Error('One or more permissions not found');
    }

    // Create role-permission assignments
    await prisma.rolePermission.createMany({
      data: newPermissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });

    return {
      message: 'Permissions assigned successfully',
      assigned: newPermissionIds.length,
    };
  }

  // Bulk revoke permissions from role
  async bulkRevokePermissionsFromRole(roleId: string, permissionIds: string[]) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Delete role-permission assignments
    const result = await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    return {
      message: 'Permissions revoked successfully',
      revoked: result.count,
    };
  }
}

export default new PermissionService();