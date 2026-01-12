import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import taskAttachmentService from '../services/taskAttachment.service';
import taskService from '../services/task.service';
import { createTestTaskData, createTestAttachmentData, generateUniqueId } from './helpers';
import prisma from '../config/prisma';
import fs from 'fs/promises';
import path from 'path';

describe('TaskAttachment Service', () => {
  const testUploadDir = path.join(process.cwd(), 'test-uploads');

  beforeAll(async () => {
    // Create test upload directory
    await fs.mkdir(testUploadDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test upload directory
    try {
      await fs.rm(testUploadDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('createAttachment', () => {
    it('should create an attachment', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const attachmentData = createTestAttachmentData(task.id);

      const attachment = await taskAttachmentService.createAttachment(attachmentData);

      expect(attachment).toBeDefined();
      expect(attachment.id).toBeDefined();
      expect(attachment.taskId).toBe(task.id);
      expect(attachment.fileName).toBe(attachmentData.fileName);
      expect(attachment.originalName).toBe(attachmentData.originalName);
    });

    it('should create history entry on attachment creation', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const attachmentData = createTestAttachmentData(task.id);

      await taskAttachmentService.createAttachment(attachmentData);

      const history = await prisma.taskHistory.findMany({
        where: {
          taskId: task.id,
          action: 'attachment_added',
        },
      });

      expect(history).toHaveLength(1);
    });
  });

  describe('getAttachments', () => {
    it('should get all attachments for a task', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const attachmentData1 = createTestAttachmentData(task.id);
      const attachmentData2 = createTestAttachmentData(task.id);

      await taskAttachmentService.createAttachment(attachmentData1);
      await taskAttachmentService.createAttachment(attachmentData2);

      const attachments = await taskAttachmentService.getAttachments(task.id);

      expect(attachments).toHaveLength(2);
    });

    it('should return empty array for task with no attachments', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);

      const attachments = await taskAttachmentService.getAttachments(task.id);

      expect(attachments).toHaveLength(0);
    });
  });

  describe('getAttachmentById', () => {
    it('should get attachment by ID', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const attachmentData = createTestAttachmentData(task.id);
      const createdAttachment = await taskAttachmentService.createAttachment(attachmentData);

      const attachment = await taskAttachmentService.getAttachmentById(createdAttachment.id);

      expect(attachment).toBeDefined();
      expect(attachment?.id).toBe(createdAttachment.id);
    });

    it('should return null for non-existent attachment', async () => {
      const attachment = await taskAttachmentService.getAttachmentById('non-existent-id');

      expect(attachment).toBeNull();
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment and file', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const testFilePath = path.join(testUploadDir, `test-${generateUniqueId()}.txt`);

      // Create test file
      await fs.writeFile(testFilePath, 'test content');

      const attachmentData = createTestAttachmentData(task.id, {
        filePath: testFilePath,
      });
      const createdAttachment = await taskAttachmentService.createAttachment(attachmentData);

      await taskAttachmentService.deleteAttachment(createdAttachment.id, attachmentData.userId);

      const attachment = await taskAttachmentService.getAttachmentById(createdAttachment.id);
      expect(attachment).toBeNull();

      // Verify file is deleted
      const fileExists = await fs.access(testFilePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should create history entry on attachment deletion', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const testFilePath = path.join(testUploadDir, `test-${generateUniqueId()}.txt`);

      // Create test file
      await fs.writeFile(testFilePath, 'test content');

      const attachmentData = createTestAttachmentData(task.id, {
        filePath: testFilePath,
      });
      const createdAttachment = await taskAttachmentService.createAttachment(attachmentData);

      await taskAttachmentService.deleteAttachment(createdAttachment.id, attachmentData.userId);

      const history = await prisma.taskHistory.findMany({
        where: {
          taskId: task.id,
          action: 'attachment_deleted',
        },
      });

      expect(history).toHaveLength(1);
    });

    it('should handle file deletion error gracefully', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const attachmentData = createTestAttachmentData(task.id, {
        filePath: '/non/existent/path/file.txt',
      });
      const createdAttachment = await taskAttachmentService.createAttachment(attachmentData);

      // Should not throw error even if file doesn't exist
      await expect(
        taskAttachmentService.deleteAttachment(createdAttachment.id, attachmentData.userId)
      ).resolves.not.toThrow();

      const attachment = await taskAttachmentService.getAttachmentById(createdAttachment.id);
      expect(attachment).toBeNull();
    });
  });

  describe('checkAttachmentOwnership', () => {
    it('should return true for attachment owner', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const userId = `user-${generateUniqueId()}`;
      const attachmentData = createTestAttachmentData(task.id, { userId });
      const createdAttachment = await taskAttachmentService.createAttachment(attachmentData);

      const isOwner = await taskAttachmentService.checkAttachmentOwnership(
        createdAttachment.id,
        userId
      );

      expect(isOwner).toBe(true);
    });

    it('should return false for non-owner', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const attachmentData = createTestAttachmentData(task.id);
      const createdAttachment = await taskAttachmentService.createAttachment(attachmentData);

      const isOwner = await taskAttachmentService.checkAttachmentOwnership(
        createdAttachment.id,
        `different-user-${generateUniqueId()}`
      );

      expect(isOwner).toBe(false);
    });
  });
});