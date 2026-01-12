import prisma from '../config/prisma';
import { TaskHistory } from '@prisma/client';

export interface CreateHistoryEntryDto {
  taskId: string;
  userId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
}

class TaskHistoryService {
  /**
   * Create a history entry
   */
  async createHistoryEntry(data: CreateHistoryEntryDto): Promise<TaskHistory> {
    const entry = await prisma.taskHistory.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        action: data.action,
        fieldName: data.fieldName,
        oldValue: data.oldValue,
        newValue: data.newValue,
      },
    });

    return entry;
  }

  /**
   * Get task history
   */
  async getTaskHistory(taskId: string, limit: number = 50): Promise<TaskHistory[]> {
    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history;
  }
}

export default new TaskHistoryService();
