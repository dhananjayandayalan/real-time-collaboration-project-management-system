import { TaskStatus, TaskPriority, TaskType } from '../../node_modules/.prisma/task-client';

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

export const createTestTaskData = (overrides?: any) => {
  const uniqueId = generateUniqueId();
  return {
    title: `Test Task ${uniqueId}`,
    description: 'Test task description',
    projectId: `project-${uniqueId}`,
    projectKey: `TEST`,
    reporterId: `user-${uniqueId}`,
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    type: TaskType.TASK,
    ...overrides,
  };
};

export const createTestCommentData = (taskId: string, overrides?: any) => {
  const uniqueId = generateUniqueId();
  return {
    taskId,
    userId: `user-${uniqueId}`,
    content: `Test comment ${uniqueId}`,
    ...overrides,
  };
};

export const createTestAttachmentData = (taskId: string, overrides?: any) => {
  const uniqueId = generateUniqueId();
  return {
    taskId,
    userId: `user-${uniqueId}`,
    fileName: `file-${uniqueId}.txt`,
    originalName: `original-${uniqueId}.txt`,
    mimeType: 'text/plain',
    fileSize: 1024,
    filePath: `/uploads/file-${uniqueId}.txt`,
    ...overrides,
  };
};