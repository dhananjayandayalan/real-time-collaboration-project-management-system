import { Request, Response } from 'express';
import workspaceService from '../services/workspace.service';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from '../utils/validation';

class WorkspaceController {
  async createWorkspace(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createWorkspaceSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const userId = req.user!.userId;

      const workspace = await workspaceService.createWorkspace({
        ...value,
        ownerId: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Workspace created successfully',
        data: workspace,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      console.error('Create workspace error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create workspace',
      });
    }
  }

  async getWorkspaces(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const workspaces = await workspaceService.getWorkspacesByUser(userId);

      res.status(200).json({
        success: true,
        data: workspaces,
      });
    } catch (error) {
      console.error('Get workspaces error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workspaces',
      });
    }
  }

  async getWorkspaceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const workspace = await workspaceService.getWorkspaceById(id);

      if (!workspace) {
        res.status(404).json({
          success: false,
          message: 'Workspace not found',
        });
        return;
      }

      // Check if user is the owner
      if (workspace.ownerId !== userId) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this workspace',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      console.error('Get workspace error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workspace',
      });
    }
  }

  async updateWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Validate request body
      const { error, value } = updateWorkspaceSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Check if workspace exists and user is the owner
      const isOwner = await workspaceService.checkWorkspaceOwnership(id, userId);

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to update this workspace',
        });
        return;
      }

      const workspace = await workspaceService.updateWorkspace(id, value);

      res.status(200).json({
        success: true,
        message: 'Workspace updated successfully',
        data: workspace,
      });
    } catch (error) {
      console.error('Update workspace error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update workspace',
      });
    }
  }

  async deleteWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Check if workspace exists and user is the owner
      const isOwner = await workspaceService.checkWorkspaceOwnership(id, userId);

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this workspace',
        });
        return;
      }

      await workspaceService.deleteWorkspace(id);

      res.status(200).json({
        success: true,
        message: 'Workspace deleted successfully',
      });
    } catch (error) {
      console.error('Delete workspace error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete workspace',
      });
    }
  }
}

export default new WorkspaceController();