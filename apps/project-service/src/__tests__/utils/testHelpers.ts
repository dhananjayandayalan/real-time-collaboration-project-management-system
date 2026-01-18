import prisma from '../../config/prisma';
import { Workspace, Project } from '../../../../node_modules/.prisma/project-client';

// Generate a unique identifier for test data
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

export const createTestWorkspace = async (
  ownerId: string,
  name: string = 'Test Workspace',
  slug: string = 'test-workspace'
): Promise<Workspace> => {
  const uniqueId = generateUniqueId();
  return prisma.workspace.create({
    data: {
      name: `${name} ${uniqueId}`,
      slug: `${slug}-${uniqueId}`,
      description: 'Test workspace description',
      ownerId,
    },
  });
};

export const createTestProject = async (
  workspaceId: string,
  createdBy: string,
  name: string = 'Test Project',
  key: string = 'TEST'
): Promise<Project> => {
  const uniqueId = generateUniqueId();
  return prisma.project.create({
    data: {
      name: `${name} ${uniqueId}`,
      key: `${key}${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
      description: 'Test project description',
      workspaceId,
      createdBy,
      members: {
        create: {
          userId: createdBy,
          role: 'OWNER',
          addedBy: createdBy,
        },
      },
    },
    include: {
      members: true,
    },
  });
};

export const cleanupTestData = async () => {
  // Clean up test data in correct order (due to foreign key constraints)
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspace.deleteMany({});
};
