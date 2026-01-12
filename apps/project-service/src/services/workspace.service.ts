import prisma from '../config/prisma';
import { Workspace } from '@prisma/client';

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
  slug: string;
  ownerId: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
}

class WorkspaceService {
  async createWorkspace(data: CreateWorkspaceDto): Promise<Workspace> {
    // Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug: data.slug },
    });

    if (existingWorkspace) {
      throw new Error('Workspace with this slug already exists');
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        ownerId: data.ownerId,
      },
    });

    return workspace;
  }

  async getWorkspacesByUser(userId: string): Promise<Workspace[]> {
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return workspaces;
  }

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return workspace;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return workspace;
  }

  async updateWorkspace(
    id: string,
    data: UpdateWorkspaceDto
  ): Promise<Workspace> {
    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return workspace;
  }

  async deleteWorkspace(id: string): Promise<void> {
    await prisma.workspace.delete({
      where: { id },
    });
  }

  async checkWorkspaceOwnership(
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

export default new WorkspaceService();