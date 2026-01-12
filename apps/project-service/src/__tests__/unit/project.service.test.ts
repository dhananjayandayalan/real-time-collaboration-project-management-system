import { describe, it, expect } from 'vitest';
import projectService from '../../services/project.service';
import { createTestWorkspace, generateUniqueId } from '../utils/testHelpers';

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_USER_ID_2 = '123e4567-e89b-12d3-a456-426614174001';

describe('ProjectService', () => {

  describe('createProject', () => {
    it('should create a new project with creator as owner', async () => {
      const workspace = await createTestWorkspace(TEST_USER_ID);
      const uniqueId = generateUniqueId();

      const project = await projectService.createProject({
        name: 'Test Project',
        key: `TEST${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        description: 'Test description',
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.workspaceId).toBe(workspace.id);
      expect(project.createdBy).toBe(TEST_USER_ID);
      expect(project.members).toHaveLength(1);
      expect(project.members[0].userId).toBe(TEST_USER_ID);
      expect(project.members[0].role).toBe('OWNER');
    });

    it('should throw error if project key already exists', async () => {
      const workspace = await createTestWorkspace(TEST_USER_ID);
      const uniqueId = generateUniqueId();
      const key = `DUP${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`;

      await projectService.createProject({
        name: 'Project 1',
        key,
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      await expect(
        projectService.createProject({
          name: 'Project 2',
          key,
          workspaceId: workspace.id,
          createdBy: TEST_USER_ID,
        })
      ).rejects.toThrow('Project with this key already exists');
    });

    it('should throw error if workspace does not exist', async () => {
      const uniqueId = generateUniqueId();

      await expect(
        projectService.createProject({
          name: 'Test Project',
          key: `TEST${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
          workspaceId: '123e4567-e89b-12d3-a456-999999999999',
          createdBy: TEST_USER_ID,
        })
      ).rejects.toThrow('Workspace not found');
    });
  });

  describe('getProjectsByUser', () => {
    it('should return projects where user is a member', async () => {
      const workspace = await createTestWorkspace(TEST_USER_ID);
      const uniqueId1 = generateUniqueId();
      const uniqueId2 = generateUniqueId();

      await projectService.createProject({
        name: 'Project 1',
        key: `PROJ1${uniqueId1.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      await projectService.createProject({
        name: 'Project 2',
        key: `PROJ2${uniqueId2.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      const projects = await projectService.getProjectsByUser(TEST_USER_ID);

      expect(projects).toHaveLength(2);
    });
  });

  describe('updateProject', () => {
    it('should update project details', async () => {
      const workspace = await createTestWorkspace(TEST_USER_ID);
      const uniqueId = generateUniqueId();

      const project = await projectService.createProject({
        name: 'Original Name',
        key: `ORIG${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      const updated = await projectService.updateProject(project.id, {
        name: 'Updated Name',
        description: 'Updated description',
        status: 'ARCHIVED',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.status).toBe('ARCHIVED');
    });
  });

  describe('addProjectMember', () => {
    it('should add a new member to project', async () => {
      const workspace = await createTestWorkspace(TEST_USER_ID);
      const uniqueId = generateUniqueId();

      const project = await projectService.createProject({
        name: 'Test Project',
        key: `TEST${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      const member = await projectService.addProjectMember({
        projectId: project.id,
        userId: TEST_USER_ID_2,
        role: 'MEMBER',
        addedBy: TEST_USER_ID,
      });

      expect(member).toBeDefined();
      expect(member.userId).toBe(TEST_USER_ID_2);
      expect(member.role).toBe('MEMBER');
    });

    it('should throw error if user is already a member', async () => {
      const workspace = await createTestWorkspace(TEST_USER_ID);
      const uniqueId = generateUniqueId();

      const project = await projectService.createProject({
        name: 'Test Project',
        key: `TEST${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      await expect(
        projectService.addProjectMember({
          projectId: project.id,
          userId: TEST_USER_ID,
          role: 'ADMIN',
          addedBy: TEST_USER_ID,
        })
      ).rejects.toThrow('User is already a member of this project');
    });
  });

  describe('removeProjectMember', () => {
    it('should remove a member from project', async () => {
      const workspace = await createTestWorkspace(TEST_USER_ID);
      const uniqueId = generateUniqueId();

      const project = await projectService.createProject({
        name: 'Test Project',
        key: `TEST${uniqueId.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        workspaceId: workspace.id,
        createdBy: TEST_USER_ID,
      });

      await projectService.addProjectMember({
        projectId: project.id,
        userId: TEST_USER_ID_2,
        role: 'MEMBER',
        addedBy: TEST_USER_ID,
      });

      await projectService.removeProjectMember(project.id, TEST_USER_ID_2);

      const membership = await projectService.checkProjectMembership(
        project.id,
        TEST_USER_ID_2
      );

      expect(membership).toBeNull();
    });
  });
});
