import { Request, Response } from 'express';
import roleService from '../services/role.service';
import {
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
} from '../utils/validation';

export class RoleController {
  // Get all roles
  async getAllRoles(_req: Request, res: Response): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();

      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: roles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get role by ID
  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);

      res.status(200).json({
        success: true,
        message: 'Role retrieved successfully',
        data: role,
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

  // Create a new role
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createRoleSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const role = await roleService.createRole(value);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role,
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

  // Update a role
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { error, value } = updateRoleSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const role = await roleService.updateRole(id, value);

      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: role,
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

  // Delete a role
  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await roleService.deleteRole(id);

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

  // Assign role to user
  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = assignRoleSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Add assignedBy from authenticated user
      const assignedBy = req.user?.userId;

      const assignment = await roleService.assignRoleToUser({
        ...value,
        assignedBy,
      });

      res.status(201).json({
        success: true,
        message: 'Role assigned to user successfully',
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

  // Revoke role from user
  async revokeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleId } = req.body;

      if (!userId || !roleId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Role ID are required',
        });
        return;
      }

      const result = await roleService.revokeRoleFromUser(userId, roleId);

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

  // Get users by role
  async getUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const users = await roleService.getUsersByRole(id);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
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

  // Get roles for a user
  async getRolesForUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const roles = await roleService.getRolesForUser(userId);

      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: roles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default new RoleController();
