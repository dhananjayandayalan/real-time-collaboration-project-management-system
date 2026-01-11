import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Checks if the authenticated user has one of the required roles.
 *
 * How it works:
 * 1. Assumes authenticateToken middleware has already run (req.user exists)
 * 2. Fetches user's roles from database
 * 3. Checks if user has any of the required roles
 * 4. Allows or denies access based on role match
 *
 * Usage:
 * app.delete('/api/users/:id', authenticateToken, authorizeRoles(['ADMIN']), controller);
 * app.post('/api/projects', authenticateToken, authorizeRoles(['ADMIN', 'MANAGER']), controller);
 *
 * @param allowedRoles - Array of role names that are allowed to access the route
 */
export const authorizeRoles = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Fetch user's roles from database
      const userWithRoles = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!userWithRoles) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Extract role names from user's roles
      const userRoles = userWithRoles.userRoles.map((ur) => ur.role.name);

      // Check if user has any of the required roles
      const hasRequiredRole = allowedRoles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: allowedRoles,
          current: userRoles,
        });
        return;
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
      });
    }
  };
};

/**
 * Permission-Based Access Control Middleware
 *
 * Checks if the user has a specific permission (more granular than roles).
 *
 * How it works:
 * 1. Assumes authenticateToken middleware has already run
 * 2. Fetches user's roles and their associated permissions
 * 3. Checks if any of the user's roles have the required permission
 * 4. Allows or denies access based on permission match
 *
 * Usage:
 * app.post('/api/projects', authenticateToken, checkPermission('projects', 'create'), controller);
 * app.delete('/api/users/:id', authenticateToken, checkPermission('users', 'delete'), controller);
 *
 * @param resource - The resource name (e.g., 'projects', 'tasks', 'users')
 * @param action - The action on the resource (e.g., 'create', 'read', 'update', 'delete')
 */
export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Fetch user with roles and permissions
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          userRoles: {
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
          },
        },
      });

      if (!userWithPermissions) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Collect all permissions from all user's roles
      const userPermissions: Array<{ resource: string; action: string }> = [];

      userWithPermissions.userRoles.forEach((userRole) => {
        userRole.role.rolePermissions.forEach((rolePermission) => {
          userPermissions.push({
            resource: rolePermission.permission.resource,
            action: rolePermission.permission.action,
          });
        });
      });

      // Check if user has the required permission
      const hasPermission = userPermissions.some(
        (perm) => perm.resource === resource && perm.action === action
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: { resource, action },
        });
        return;
      }

      // User has required permission, proceed
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

/**
 * Check if user owns the resource
 *
 * Useful for ensuring users can only access/modify their own data.
 *
 * How it works:
 * 1. Extracts resource ID from request params
 * 2. Fetches resource from database
 * 3. Checks if resource's userId matches authenticated user's ID
 * 4. Allows or denies access based on ownership
 *
 * Usage:
 * app.patch('/api/users/:id', authenticateToken, checkOwnership('user'), controller);
 *
 * @param resourceType - Type of resource to check ('user', 'project', etc.)
 * @param paramName - Name of the param containing the resource ID (default: 'id')
 */
export const checkOwnership = (resourceType: string, paramName: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const resourceId = req.params[paramName];

      if (!resourceId) {
        res.status(400).json({
          success: false,
          message: `Resource ID (${paramName}) is required`,
        });
        return;
      }

      // Check ownership based on resource type
      switch (resourceType) {
        case 'user':
          // For user resources, simply check if the ID matches
          if (resourceId !== req.user.userId) {
            res.status(403).json({
              success: false,
              message: 'You can only access your own profile',
            });
            return;
          }
          break;

        // Add more resource types as needed
        // case 'project':
        //   const project = await prisma.project.findUnique({
        //     where: { id: resourceId },
        //   });
        //   if (project?.ownerId !== req.user.userId) {
        //     return res.status(403).json({ message: 'Not the owner' });
        //   }
        //   break;

        default:
          res.status(400).json({
            success: false,
            message: `Unknown resource type: ${resourceType}`,
          });
          return;
      }

      // Ownership verified, proceed
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership check failed',
      });
    }
  };
};
