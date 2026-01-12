import { Request, Response } from 'express';
import taskService from '../services/task.service';
import taskCommentService from '../services/taskComment.service';
import taskHistoryService from '../services/taskHistory.service';
import axios from 'axios';
import {
  createTaskSchema,
  updateTaskSchema,
  createCommentSchema,
  updateCommentSchema,
  addWatcherSchema,
} from '../utils/validation';

const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL || 'http://localhost:3002';

class TaskController {
  /**
   * Verify project exists and user has access
   */
  private async verifyProjectAccess(
    projectId: string,
    token: string
  ): Promise<{ exists: boolean; projectKey?: string }> {
    try {
      const response = await axios.get(`${PROJECT_SERVICE_URL}/api/projects/${projectId}`, {
        headers: {
          Authorization: token,
        },
      });

      if (response.data.success && response.data.data) {
        return {
          exists: true,
          projectKey: response.data.data.key,
        };
      }

      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Create task
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createTaskSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const userId = req.user!.userId;
      const token = req.headers.authorization!;

      // Verify project exists and get project key
      const projectCheck = await this.verifyProjectAccess(value.projectId, token);

      if (!projectCheck.exists) {
        res.status(404).json({
          success: false,
          message: 'Project not found or you do not have access',
        });
        return;
      }

      const task = await taskService.createTask({
        ...value,
        projectKey: projectCheck.projectKey!,
        reporterId: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task',
      });
    }
  }

  /**
   * Get tasks with filters
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        assigneeId,
        reporterId,
        status,
        priority,
        type,
        search,
        tags,
        dueDateFrom,
        dueDateTo,
      } = req.query;

      const filters: any = {};

      if (projectId) filters.projectId = projectId as string;
      if (assigneeId) filters.assigneeId = assigneeId as string;
      if (reporterId) filters.reporterId = reporterId as string;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (type) filters.type = type;
      if (search) filters.search = search as string;
      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : [tags];
      }
      if (dueDateFrom) filters.dueDateFrom = new Date(dueDateFrom as string);
      if (dueDateTo) filters.dueDateTo = new Date(dueDateTo as string);

      const tasks = await taskService.getTasks(filters);

      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tasks',
      });
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const task = await taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch task',
      });
    }
  }

  /**
   * Update task
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const { error, value } = updateTaskSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const task = await taskService.updateTask(id, value, userId);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
      });
    }
  }

  /**
   * Delete task
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await taskService.deleteTask(id);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task',
      });
    }
  }

  // ==== Comment endpoints ====

  /**
   * Add comment to task
   */
  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const { error, value } = createCommentSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const comment = await taskCommentService.createComment({
        taskId: id,
        userId,
        content: value.content,
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment,
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
      });
    }
  }

  /**
   * Get comments for task
   */
  async getComments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const comments = await taskCommentService.getComments(id);

      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments',
      });
    }
  }

  /**
   * Update comment
   */
  async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.user!.userId;

      const { error, value } = updateCommentSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      // Check ownership
      const isOwner = await taskCommentService.checkCommentOwnership(commentId, userId);

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'You can only edit your own comments',
        });
        return;
      }

      const comment = await taskCommentService.updateComment(commentId, value, userId);

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: comment,
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
      });
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.user!.userId;

      // Check ownership
      const isOwner = await taskCommentService.checkCommentOwnership(commentId, userId);

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'You can only delete your own comments',
        });
        return;
      }

      await taskCommentService.deleteComment(commentId);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
      });
    }
  }

  // ==== Watcher endpoints ====

  /**
   * Add watcher to task
   */
  async addWatcher(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const { error, value } = addWatcherSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      await taskService.addWatcher(id, value.userId, userId);

      res.status(200).json({
        success: true,
        message: 'Watcher added successfully',
      });
    } catch (error) {
      console.error('Add watcher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add watcher',
      });
    }
  }

  /**
   * Remove watcher from task
   */
  async removeWatcher(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;

      await taskService.removeWatcher(id, userId);

      res.status(200).json({
        success: true,
        message: 'Watcher removed successfully',
      });
    } catch (error) {
      console.error('Remove watcher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove watcher',
      });
    }
  }

  /**
   * Get task history
   */
  async getTaskHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const history = await taskHistoryService.getTaskHistory(id);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch task history',
      });
    }
  }
}

export default new TaskController();