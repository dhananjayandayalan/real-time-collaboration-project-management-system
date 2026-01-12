import prisma from '../config/prisma';
import { TaskAttachment } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import taskHistoryService from './taskHistory.service';

export interface CreateAttachmentDto {
  taskId: string;
  userId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
}

class TaskAttachmentService {
  /**
   * Create attachment record
   */
  async createAttachment(data: CreateAttachmentDto): Promise<TaskAttachment> {
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        fileName: data.fileName,
        originalName: data.originalName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        filePath: data.filePath,
      },
    });

    // Create history entry
    await taskHistoryService.createHistoryEntry({
      taskId: data.taskId,
      userId: data.userId,
      action: 'attachment_added',
      fieldName: 'attachment',
      oldValue: null,
      newValue: data.originalName,
    });

    return attachment;
  }

  /**
   * Get attachments for a task
   */
  async getAttachments(taskId: string): Promise<TaskAttachment[]> {
    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(id: string): Promise<TaskAttachment | null> {
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id },
    });

    return attachment;
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id: string, userId: string): Promise<void> {
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Delete file from filesystem
    try {
      await fs.unlink(attachment.filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Delete record from database
    await prisma.taskAttachment.delete({
      where: { id },
    });

    // Create history entry
    await taskHistoryService.createHistoryEntry({
      taskId: attachment.taskId,
      userId,
      action: 'attachment_deleted',
      fieldName: 'attachment',
      oldValue: attachment.originalName,
      newValue: null,
    });
  }

  /**
   * Check if user owns the attachment
   */
  async checkAttachmentOwnership(attachmentId: string, userId: string): Promise<boolean> {
    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        userId,
      },
    });

    return !!attachment;
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir(): Promise<string> {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const fullPath = path.resolve(uploadDir);

    try {
      await fs.access(fullPath);
    } catch {
      await fs.mkdir(fullPath, { recursive: true });
    }

    return fullPath;
  }
}

export default new TaskAttachmentService();
