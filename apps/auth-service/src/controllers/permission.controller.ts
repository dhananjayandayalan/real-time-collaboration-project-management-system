import { Request, Response } from 'express';
import permissionService from '../services/permission.service';
import {
  assignPermissionSchema,
  bulkAssignPermissionsSchema,
} from '../utils/validation';

export class PermissionController {
  // Get all permissions
  async getAllPermissions(_req: Request, res: Response): Promise<void> {
    try {
      const permissions = await permissionService.getAllPermissions();

      res.status(200).json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: permissions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get permission by ID
  async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await permissionService.getPermissionById(id);

      res.status(200).json({
        success: true,
        message: 'Permission retrieved successfully',
        data: permission,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Get permissions by resource
  async getPermissionsByResource(req: Request, res: Response): Promise<void> {
    try {
      const { resource } = req.params;
      const permissions = await permissionService.getPermissionsByResource(resource);

      res.status(200).json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: permissions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Assign permission to role
  async assignPermissionToRole(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = assignPermissionSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const assignment = await permissionService.assignPermissionToRole(value);

      res.status(201).json({
        success: true,
        message: 'Permission assigned to role successfully',
        data: assignment,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Revoke permission from role
  async revokePermissionFromRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, permissionId } = req.body;

      if (!roleId || !permissionId) {
        res.status(400).json({
          success: false,
          message: 'Role ID and Permission ID are required',
        });
        return;
      }

      const result = await permissionService.revokePermissionFromRole(
        roleId,
        permissionId
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Get permissions for a role
  async getPermissionsForRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const permissions = await permissionService.getPermissionsForRole(roleId);

      res.status(200).json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: permissions,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Get roles for a permission
  async getRolesForPermission(req: Request, res: Response): Promise<void> {
    try {
      const { permissionId } = req.params;
      const roles = await permissionService.getRolesForPermission(permissionId);

      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: roles,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Bulk assign permissions to role
  async bulkAssignPermissionsToRole(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = bulkAssignPermissionsSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const result = await permissionService.bulkAssignPermissionsToRole(
        value.roleId,
        value.permissionIds
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          assigned: result.assigned,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  // Bulk revoke permissions from role
  async bulkRevokePermissionsFromRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, permissionIds } = req.body;

      if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
        res.status(400).json({
          success: false,
          message: 'Role ID and Permission IDs (array) are required',
        });
        return;
      }

      const result = await permissionService.bulkRevokePermissionsFromRole(
        roleId,
        permissionIds
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          revoked: result.revoked,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }
}

export default new PermissionController();