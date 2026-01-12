import prisma from '../config/prisma';

export interface CreateRoleData {
  name: string;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export interface AssignRoleToUserData {
  userId: string;
  roleId: string;
  assignedBy?: string;
}

export class RoleService {
  // Get all roles
  async getAllRoles() {
    return await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get role by ID
  async getRoleById(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
      users: role.userRoles.map((ur) => ur.user),
      rolePermissions: undefined,
      userRoles: undefined,
    };
  }

  // Get role by name
  async getRoleByName(name: string) {
    const role = await prisma.role.findUnique({
      where: { name },
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

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
      rolePermissions: undefined,
    };
  }

  // Create a new role
  async createRole(data: CreateRoleData) {
    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    return await prisma.role.create({
      data,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  // Update a role
  async updateRole(roleId: string, data: UpdateRoleData) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // If updating name, check if new name is already taken
    if (data.name && data.name !== role.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name: data.name },
      });

      if (existingRole) {
        throw new Error('Role with this name already exists');
      }
    }

    return await prisma.role.update({
      where: { id: roleId },
      data,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  // Delete a role
  async deleteRole(roleId: string) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Prevent deletion of roles that are assigned to users
    if (role._count.userRoles > 0) {
      throw new Error(
        `Cannot delete role. It is currently assigned to ${role._count.userRoles} user(s)`
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    return { message: 'Role deleted successfully' };
  }

  // Assign role to user
  async assignRoleToUser(data: AssignRoleToUserData) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: data.userId,
          roleId: data.roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error('User already has this role');
    }

    return await prisma.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
        assignedBy: data.assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        role: true,
      },
    });
  }

  // Revoke role from user
  async revokeRoleFromUser(userId: string, roleId: string) {
    // Check if assignment exists
    const assignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!assignment) {
      throw new Error('User does not have this role');
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return { message: 'Role revoked successfully' };
  }

  // Get users by role
  async getUsersByRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.userRoles.map((ur) => ({
      ...ur.user,
      assignedAt: ur.assignedAt,
    }));
  }

  // Get roles for a user
  async getRolesForUser(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return userRoles.map((ur) => ({
      ...ur.role,
      assignedAt: ur.assignedAt,
      permissions: ur.role.rolePermissions.map((rp) => rp.permission),
      rolePermissions: undefined,
    }));
  }
}

export default new RoleService();
