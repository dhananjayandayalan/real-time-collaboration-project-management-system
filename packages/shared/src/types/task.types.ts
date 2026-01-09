// Task-related types

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskType {
  FEATURE = 'FEATURE',
  BUG = 'BUG',
  IMPROVEMENT = 'IMPROVEMENT',
  DOCUMENTATION = 'DOCUMENTATION',
}

export interface Task {
  id: string;
  taskId: string; // e.g., "PROJ-123"
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedById: string;
  uploadedAt: Date;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  priority: TaskPriority;
  type: TaskType;
  assigneeId?: string;
  dueDate?: Date;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string;
  dueDate?: Date;
}

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  search?: string;
}