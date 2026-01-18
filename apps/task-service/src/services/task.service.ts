import prisma from '../config/prisma';
import { Task, TaskStatus, TaskPriority, TaskType, Prisma } from '../../node_modules/.prisma/task-client';
import { redisPublisher } from '../config/redis';
import taskHistoryService from './taskHistory.service';

export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: string;
  projectKey: string; // Will be provided by controller after validation
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string;
  reporterId: string;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  reporterId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  search?: string;
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

class TaskService {
  /**
   * Generate unique task ID (e.g., PROJ-123)
   */
  async generateTaskId(projectKey: string): Promise<string> {
    // Get the count of tasks in this project
    const count = await prisma.task.count({
      where: {
        taskId: {
          startsWith: `${projectKey}-`,
        },
      },
    });

    return `${projectKey}-${count + 1}`;
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDto): Promise<Task> {
    // Generate task ID
    const taskId = await this.generateTaskId(data.projectKey);

    // Create task
    const task = await prisma.task.create({
      data: {
        taskId,
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        type: data.type || 'TASK',
        assigneeId: data.assigneeId,
        reporterId: data.reporterId,
        dueDate: data.dueDate,
        startDate: data.startDate,
        estimatedHours: data.estimatedHours,
        tags: data.tags || [],
      },
      include: {
        comments: true,
        attachments: true,
        watchers: true,
      },
    });

    // Create history entry
    await taskHistoryService.createHistoryEntry({
      taskId: task.id,
      userId: data.reporterId,
      action: 'created',
      fieldName: null,
      oldValue: null,
      newValue: null,
    });

    // Auto-watch: Add reporter as watcher
    await this.addWatcher(task.id, data.reporterId, data.reporterId);

    // If assigned, add assignee as watcher
    if (data.assigneeId) {
      await this.addWatcher(task.id, data.assigneeId, data.reporterId);
    }

    // Publish event to Redis
    await this.publishEvent('task:created', task);

    return task;
  }

  /**
   * Get tasks with filters
   */
  async getTasks(filters: TaskFilters): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.reporterId) where.reporterId = filters.reporterId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.type) where.type = filters.type;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { taskId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = filters.dueDateFrom;
      if (filters.dueDateTo) where.dueDate.lte = filters.dueDateTo;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        attachments: true,
        watchers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks;
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        watchers: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    return task;
  }

  /**
   * Get task by task ID (e.g., PROJ-123)
   */
  async getTaskByTaskId(taskId: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { taskId },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        watchers: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    return task;
  }

  /**
   * Update task
   */
  async updateTask(
    id: string,
    data: UpdateTaskDto,
    userId: string
  ): Promise<Task> {
    // Get current task to track changes
    const currentTask = await prisma.task.findUnique({ where: { id } });

    if (!currentTask) {
      throw new Error('Task not found');
    }

    // Track changed fields for history
    const changes: Array<{
      fieldName: string;
      oldValue: string;
      newValue: string;
    }> = [];

    // Compare and track changes
    if (data.title && data.title !== currentTask.title) {
      changes.push({
        fieldName: 'title',
        oldValue: currentTask.title,
        newValue: data.title,
      });
    }

    if (data.status && data.status !== currentTask.status) {
      changes.push({
        fieldName: 'status',
        oldValue: currentTask.status,
        newValue: data.status,
      });
    }

    if (data.priority && data.priority !== currentTask.priority) {
      changes.push({
        fieldName: 'priority',
        oldValue: currentTask.priority,
        newValue: data.priority,
      });
    }

    if (data.assigneeId !== undefined && data.assigneeId !== currentTask.assigneeId) {
      changes.push({
        fieldName: 'assigneeId',
        oldValue: currentTask.assigneeId || 'unassigned',
        newValue: data.assigneeId || 'unassigned',
      });

      // If task is assigned to someone new, add them as watcher
      if (data.assigneeId) {
        await this.addWatcher(id, data.assigneeId, userId);
      }
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        type: data.type,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        startDate: data.startDate,
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        tags: data.tags,
      },
      include: {
        comments: true,
        attachments: true,
        watchers: true,
      },
    });

    // Create history entries for all changes
    for (const change of changes) {
      await taskHistoryService.createHistoryEntry({
        taskId: id,
        userId,
        action: 'updated',
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
      });
    }

    // Publish event to Redis
    await this.publishEvent('task:updated', task);

    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    // Get task info before deleting for Redis event
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, taskId: true, projectId: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await prisma.task.delete({
      where: { id },
    });

    // Publish event to Redis with taskId and projectId for routing
    await this.publishEvent('task:deleted', {
      taskId: task.taskId,
      projectId: task.projectId,
    });
  }

  /**
   * Add watcher to task
   */
  async addWatcher(taskId: string, userId: string, addedBy: string): Promise<void> {
    try {
      await prisma.taskWatcher.create({
        data: {
          taskId,
          userId,
          addedBy,
        },
      });
    } catch (error) {
      // Ignore if already watching
    }
  }

  /**
   * Remove watcher from task
   */
  async removeWatcher(taskId: string, userId: string): Promise<void> {
    await prisma.taskWatcher.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });
  }

  /**
   * Check if user is watching task
   */
  async isWatching(taskId: string, userId: string): Promise<boolean> {
    const watcher = await prisma.taskWatcher.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    return !!watcher;
  }

  /**
   * Publish event to Redis for real-time updates
   */
  private async publishEvent(event: string, data: any): Promise<void> {
    try {
      await redisPublisher.publish(event, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }
}

export default new TaskService();
