import { taskApi } from './axiosInstance';
import type {
  Task,
  TaskComment,
  TaskAttachment,
  TaskHistory,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
} from '@/types';

export const taskService = {
  // Task CRUD
  async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    const response = await taskApi.get('/tasks', { params: filters });
    return response.data.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await taskApi.get(`/tasks/${id}`);
    return response.data.data;
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await taskApi.post('/tasks', data);
    return response.data.data;
  },

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await taskApi.patch(`/tasks/${id}`, data);
    return response.data.data;
  },

  async deleteTask(id: string): Promise<void> {
    await taskApi.delete(`/tasks/${id}`);
  },

  // Comments
  async getComments(taskId: string): Promise<TaskComment[]> {
    const response = await taskApi.get(`/tasks/${taskId}/comments`);
    return response.data.data;
  },

  async addComment(taskId: string, content: string): Promise<TaskComment> {
    const response = await taskApi.post(`/tasks/${taskId}/comments`, { content });
    return response.data.data;
  },

  async updateComment(taskId: string, commentId: string, content: string): Promise<TaskComment> {
    const response = await taskApi.patch(`/tasks/${taskId}/comments/${commentId}`, { content });
    return response.data.data;
  },

  async deleteComment(taskId: string, commentId: string): Promise<void> {
    await taskApi.delete(`/tasks/${taskId}/comments/${commentId}`);
  },

  // Attachments
  async getAttachments(taskId: string): Promise<TaskAttachment[]> {
    const response = await taskApi.get(`/tasks/${taskId}/attachments`);
    return response.data.data;
  },

  async uploadAttachment(taskId: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await taskApi.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
    await taskApi.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  },

  // Watchers
  async getWatchers(taskId: string): Promise<string[]> {
    const response = await taskApi.get(`/tasks/${taskId}/watchers`);
    return response.data.data;
  },

  async addWatcher(taskId: string, userId: string): Promise<void> {
    await taskApi.post(`/tasks/${taskId}/watchers`, { userId });
  },

  async removeWatcher(taskId: string, userId: string): Promise<void> {
    await taskApi.delete(`/tasks/${taskId}/watchers/${userId}`);
  },

  // History
  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    const response = await taskApi.get(`/tasks/${taskId}/history`);
    return response.data.data;
  },
};
