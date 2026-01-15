import { projectApi } from './axiosInstance';
import type {
  Project,
  Workspace,
  ProjectMember,
  CreateProjectData,
  UpdateProjectData,
} from '@/types';

export const projectService = {
  // Workspace endpoints
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await projectApi.get('/workspaces');
    return response.data.data;
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await projectApi.get(`/workspaces/${id}`);
    return response.data.data;
  },

  async createWorkspace(data: { name: string; description?: string }): Promise<Workspace> {
    const response = await projectApi.post('/workspaces', data);
    return response.data.data;
  },

  async updateWorkspace(id: string, data: { name?: string; description?: string }): Promise<Workspace> {
    const response = await projectApi.patch(`/workspaces/${id}`, data);
    return response.data.data;
  },

  async deleteWorkspace(id: string): Promise<void> {
    await projectApi.delete(`/workspaces/${id}`);
  },

  async addWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    await projectApi.post(`/workspaces/${workspaceId}/members`, { userId });
  },

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    await projectApi.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  // Project endpoints
  async getProjects(workspaceId?: string): Promise<Project[]> {
    const params = workspaceId ? { workspaceId } : {};
    const response = await projectApi.get('/projects', { params });
    return response.data.data;
  },

  async getProject(id: string): Promise<Project> {
    const response = await projectApi.get(`/projects/${id}`);
    return response.data.data;
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await projectApi.post('/projects', data);
    return response.data.data;
  },

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const response = await projectApi.patch(`/projects/${id}`, data);
    return response.data.data;
  },

  async deleteProject(id: string): Promise<void> {
    await projectApi.delete(`/projects/${id}`);
  },

  // Project members
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await projectApi.get(`/projects/${projectId}/members`);
    return response.data.data;
  },

  async addProjectMember(projectId: string, userId: string, role: string): Promise<ProjectMember> {
    const response = await projectApi.post(`/projects/${projectId}/members`, { userId, role });
    return response.data.data;
  },

  async updateProjectMemberRole(projectId: string, userId: string, role: string): Promise<ProjectMember> {
    const response = await projectApi.patch(`/projects/${projectId}/members/${userId}`, { role });
    return response.data.data;
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await projectApi.delete(`/projects/${projectId}/members/${userId}`);
  },
};
