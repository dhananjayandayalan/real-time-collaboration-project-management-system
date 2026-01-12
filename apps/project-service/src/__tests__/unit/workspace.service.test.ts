import { describe, it, expect } from 'vitest';
import workspaceService from '../../services/workspace.service';
import { generateUniqueId } from '../utils/testHelpers';

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('WorkspaceService', () => {

  describe('createWorkspace', () => {
    it('should create a new workspace', async () => {
      const uniqueId = generateUniqueId();
      const workspaceName = `Test Workspace ${uniqueId}`;

      const workspace = await workspaceService.createWorkspace({
        name: workspaceName,
        slug: `test-workspace-${uniqueId}`,
        description: 'Test description',
        ownerId: TEST_USER_ID,
      });

      expect(workspace).toBeDefined();
      expect(workspace.name).toBe(workspaceName);
      expect(workspace.ownerId).toBe(TEST_USER_ID);
      expect(workspace.description).toBe('Test description');
    });

    it('should throw error if slug already exists', async () => {
      const uniqueId = generateUniqueId();
      const slug = `duplicate-slug-${uniqueId}`;

      await workspaceService.createWorkspace({
        name: 'Workspace 1',
        slug,
        ownerId: TEST_USER_ID,
      });

      await expect(
        workspaceService.createWorkspace({
          name: 'Workspace 2',
          slug,
          ownerId: TEST_USER_ID,
        })
      ).rejects.toThrow('Workspace with this slug already exists');
    });
  });

  describe('getWorkspacesByUser', () => {
    it('should return workspaces owned by user', async () => {
      const uniqueId1 = generateUniqueId();
      const uniqueId2 = generateUniqueId();

      await workspaceService.createWorkspace({
        name: 'Workspace 1',
        slug: `workspace-1-${uniqueId1}`,
        ownerId: TEST_USER_ID,
      });

      await workspaceService.createWorkspace({
        name: 'Workspace 2',
        slug: `workspace-2-${uniqueId2}`,
        ownerId: TEST_USER_ID,
      });

      const workspaces = await workspaceService.getWorkspacesByUser(TEST_USER_ID);

      expect(workspaces).toHaveLength(2);
      expect(workspaces[0].ownerId).toBe(TEST_USER_ID);
      expect(workspaces[1].ownerId).toBe(TEST_USER_ID);
    });

    it('should return empty array if user has no workspaces', async () => {
      const workspaces = await workspaceService.getWorkspacesByUser(
        '123e4567-e89b-12d3-a456-426614174999'
      );

      expect(workspaces).toHaveLength(0);
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace name and description', async () => {
      const uniqueId = generateUniqueId();

      const workspace = await workspaceService.createWorkspace({
        name: 'Original Name',
        slug: `workspace-${uniqueId}`,
        ownerId: TEST_USER_ID,
      });

      const updated = await workspaceService.updateWorkspace(workspace.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace', async () => {
      const uniqueId = generateUniqueId();

      const workspace = await workspaceService.createWorkspace({
        name: 'To Delete',
        slug: `to-delete-${uniqueId}`,
        ownerId: TEST_USER_ID,
      });

      await workspaceService.deleteWorkspace(workspace.id);

      const deleted = await workspaceService.getWorkspaceById(workspace.id);
      expect(deleted).toBeNull();
    });
  });

  describe('checkWorkspaceOwnership', () => {
    it('should return true if user owns workspace', async () => {
      const uniqueId = generateUniqueId();

      const workspace = await workspaceService.createWorkspace({
        name: 'Test',
        slug: `test-${uniqueId}`,
        ownerId: TEST_USER_ID,
      });

      const isOwner = await workspaceService.checkWorkspaceOwnership(
        workspace.id,
        TEST_USER_ID
      );

      expect(isOwner).toBe(true);
    });

    it('should return false if user does not own workspace', async () => {
      const uniqueId = generateUniqueId();

      const workspace = await workspaceService.createWorkspace({
        name: 'Test',
        slug: `test-${uniqueId}`,
        ownerId: TEST_USER_ID,
      });

      const isOwner = await workspaceService.checkWorkspaceOwnership(
        workspace.id,
        '123e4567-e89b-12d3-a456-426614174999'
      );

      expect(isOwner).toBe(false);
    });
  });
});
