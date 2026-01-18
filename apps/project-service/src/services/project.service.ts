import prisma from '../config/prisma';
import { Project, ProjectMember, ProjectStatus, ProjectMemberRole } from '../../node_modules/.prisma/project-client';

export interface CreateProjectDto {
  name: string;
  description?: string;
  key: string;
  workspaceId: string;
  createdBy: string;
  status?: ProjectStatus;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface AddProjectMemberDto {
  projectId: string;
  userId: string;
  role?: ProjectMemberRole;
  addedBy: string;
}

export interface UpdateProjectMemberDto {
  role: ProjectMemberRole;
}

class ProjectService {
  async createProject(data: CreateProjectDto): Promise<Project> {
    // Check if key already exists
    const existingProject = await prisma.project.findUnique({
      where: { key: data.key },
    });

    if (existingProject) {
      throw new Error('Project with this key already exists');
    }

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: data.workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Create project and add creator as owner
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        key: data.key,
        workspaceId: data.workspaceId,
        createdBy: data.createdBy,
        status: data.status || 'ACTIVE',
        members: {
          create: {
            userId: data.createdBy,
            role: 'OWNER',
            addedBy: data.createdBy,
          },
        },
      },
      include: {
        workspace: true,
        members: true,
      },
    });

    return project;
  }

  async getProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        workspace: true,
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        workspace: true,
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  async getProjectById(id: string): Promise<Project | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workspace: true,
        members: true,
      },
    });

    return project;
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
      },
      include: {
        workspace: true,
        members: true,
      },
    });

    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  }

  async checkProjectMembership(
    projectId: string,
    userId: string
  ): Promise<ProjectMember | null> {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return member;
  }

  async addProjectMember(data: AddProjectMemberDto): Promise<ProjectMember> {
    // Check if user is already a member
    const existingMember = await this.checkProjectMembership(
      data.projectId,
      data.userId
    );

    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        role: data.role || 'MEMBER',
        addedBy: data.addedBy,
      },
    });

    return member;
  }

  async updateProjectMember(
    projectId: string,
    userId: string,
    data: UpdateProjectMemberDto
  ): Promise<ProjectMember> {
    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: {
        role: data.role,
      },
    });

    return member;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { addedAt: 'asc' },
    });

    return members;
  }

  async checkWorkspaceAccess(
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId,
      },
    });

    return !!workspace;
  }
}

export default new ProjectService();
