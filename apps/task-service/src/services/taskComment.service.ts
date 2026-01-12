import prisma from '../config/prisma';
import { TaskComment } from '@prisma/client';
import { redisPublisher } from '../config/redis';
import taskHistoryService from './taskHistory.service';

export interface CreateCommentDto {
  taskId: string;
  userId: string;
  content: string;
}

export interface UpdateCommentDto {
  content: string;
}

class TaskCommentService {
  /**
   * Create a comment
   */
  async createComment(data: CreateCommentDto): Promise<TaskComment> {
    const comment = await prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
      },
    });

    // Create history entry
    await taskHistoryService.createHistoryEntry({
      taskId: data.taskId,
      userId: data.userId,
      action: 'commented',
      fieldName: null,
      oldValue: null,
      newValue: null,
    });

    // Publish event to Redis
    await this.publishEvent('task:comment:added', {
      taskId: data.taskId,
      comment,
    });

    return comment;
  }

  /**
   * Get comments for a task
   */
  async getComments(taskId: string): Promise<TaskComment[]> {
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  /**
   * Get comment by ID
   */
  async getCommentById(id: string): Promise<TaskComment | null> {
    const comment = await prisma.taskComment.findUnique({
      where: { id },
    });

    return comment;
  }

  /**
   * Update comment
   */
  async updateComment(
    id: string,
    data: UpdateCommentDto,
    _userId: string
  ): Promise<TaskComment> {
    const comment = await prisma.taskComment.update({
      where: { id },
      data: {
        content: data.content,
      },
    });

    return comment;
  }

  /**
   * Delete comment
   */
  async deleteComment(id: string): Promise<void> {
    await prisma.taskComment.delete({
      where: { id },
    });
  }

  /**
   * Check if user owns the comment
   */
  async checkCommentOwnership(commentId: string, userId: string): Promise<boolean> {
    const comment = await prisma.taskComment.findFirst({
      where: {
        id: commentId,
        userId,
      },
    });

    return !!comment;
  }

  /**
   * Publish event to Redis
   */
  private async publishEvent(event: string, data: any): Promise<void> {
    try {
      await redisPublisher.publish(event, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }
}

export default new TaskCommentService();
