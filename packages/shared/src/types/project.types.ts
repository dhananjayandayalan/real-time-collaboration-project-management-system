// Project-related types

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  PLANNING = 'PLANNING',
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  key: string; // e.g., "PROJ"
  name: string;
  description?: string;
  status: ProjectStatus;
  workspaceId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  addedAt: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  workspaceId: string;
  key: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}