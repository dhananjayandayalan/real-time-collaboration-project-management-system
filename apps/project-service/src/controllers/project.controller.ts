import { Request, Response } from 'express';
import projectService from '../services/project.service';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from '../utils/validation';

class ProjectController {
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createProjectSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const userId = req.user!.userId;

      // Check if user has access to the workspace
      const hasAccess = await projectService.checkWorkspaceAccess(
        value.workspaceId,
        userId
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this workspace',
        });
        return;
      }

      const project = await projectService.createProject({
        ...value,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
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
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project',
      });
    }
  }

  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { workspaceId } = req.query;

      let projects;

      if (workspaceId) {
        // Get projects by workspace
        const hasAccess = await projectService.checkWorkspaceAccess(
          workspaceId as string,
          userId
        );

        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: 'You do not have access to this workspace',
          });
          return;
        }

        projects = await projectService.getProjectsByWorkspace(
          workspaceId as string
        );
      } else {
        // Get projects where user is a member
        projects = await projectService.getProjectsByUser(userId);
      }

      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
      });
    }
  }

  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const project = await projectService.getProjectById(id);

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      // Check if user is a member of the project
      const membership = await projectService.checkProjectMembership(id, userId);

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project',
      });
    }
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Validate request body
      const { error, value } = updateProjectSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Check if user is a member with appropriate role
      const membership = await projectService.checkProjectMembership(id, userId);

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
        return;
      }

      // Only OWNER and ADMIN can update project
      if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to update this project',
        });
        return;
      }

      const project = await projectService.updateProject(id, value);

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project,
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
      });
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Check if user is a member with appropriate role
      const membership = await projectService.checkProjectMembership(id, userId);

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
        return;
      }

      // Only OWNER can delete project
      if (membership.role !== 'OWNER') {
        res.status(403).json({
          success: false,
          message: 'Only project owners can delete projects',
        });
        return;
      }

      await projectService.deleteProject(id);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
      });
    }
  }

  async addProjectMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Validate request body
      const { error, value } = addProjectMemberSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Check if current user is a member with appropriate role
      const membership = await projectService.checkProjectMembership(id, userId);

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
        return;
      }

      // Only OWNER and ADMIN can add members
      if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to add members to this project',
        });
        return;
      }

      const member = await projectService.addProjectMember({
        projectId: id,
        userId: value.userId,
        role: value.role,
        addedBy: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: member,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already a member')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Add project member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add member',
      });
    }
  }

  async updateProjectMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId: targetUserId } = req.params;
      const userId = req.user!.userId;

      // Validate request body
      const { error, value } = updateProjectMemberSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Check if current user is a member with appropriate role
      const membership = await projectService.checkProjectMembership(id, userId);

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
        return;
      }

      // Only OWNER and ADMIN can update member roles
      if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message:
            'You do not have permission to update member roles in this project',
        });
        return;
      }

      const member = await projectService.updateProjectMember(
        id,
        targetUserId,
        value
      );

      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: member,
      });
    } catch (error) {
      console.error('Update project member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member role',
      });
    }
  }

  async removeProjectMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId: targetUserId } = req.params;
      const userId = req.user!.userId;

      // Check if current user is a member with appropriate role
      const membership = await projectService.checkProjectMembership(id, userId);

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
        return;
      }

      // Only OWNER and ADMIN can remove members
      if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message:
            'You do not have permission to remove members from this project',
        });
        return;
      }

      // Cannot remove the last owner
      const targetMembership = await projectService.checkProjectMembership(
        id,
        targetUserId
      );

      if (targetMembership?.role === 'OWNER') {
        const members = await projectService.getProjectMembers(id);
        const ownerCount = members.filter((m) => m.role === 'OWNER').length;

        if (ownerCount <= 1) {
          res.status(400).json({
            success: false,
            message: 'Cannot remove the last owner of the project',
          });
          return;
        }
      }

      await projectService.removeProjectMember(id, targetUserId);

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Remove project member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove member',
      });
    }
  }

  async getProjectMembers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Check if user is a member of the project
      const membership = await projectService.checkProjectMembership(id, userId);

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this project',
        });
        return;
      }

      const members = await projectService.getProjectMembers(id);

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      console.error('Get project members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project members',
      });
    }
  }
}

export default new ProjectController();
