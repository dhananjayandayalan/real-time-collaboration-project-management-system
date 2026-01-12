import { Request, Response } from 'express';
import taskAttachmentService from '../services/taskAttachment.service';

class AttachmentController {
  /**
   * Upload attachment
   */
  async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      const attachment = await taskAttachmentService.createAttachment({
        taskId: id,
        userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
      });

      res.status(201).json({
        success: true,
        message: 'Attachment uploaded successfully',
        data: attachment,
      });
    } catch (error) {
      console.error('Upload attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload attachment',
      });
    }
  }

  /**
   * Get attachments for task
   */
  async getAttachments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const attachments = await taskAttachmentService.getAttachments(id);

      res.status(200).json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      console.error('Get attachments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attachments',
      });
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { attachmentId } = req.params;
      const userId = req.user!.userId;

      // Check ownership - only owner can delete
      const isOwner = await taskAttachmentService.checkAttachmentOwnership(
        attachmentId,
        userId
      );

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'You can only delete your own attachments',
        });
        return;
      }

      await taskAttachmentService.deleteAttachment(attachmentId, userId);

      res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error) {
      console.error('Delete attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete attachment',
      });
    }
  }

  /**
   * Download attachment
   */
  async downloadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { attachmentId } = req.params;

      const attachment = await taskAttachmentService.getAttachmentById(attachmentId);

      if (!attachment) {
        res.status(404).json({
          success: false,
          message: 'Attachment not found',
        });
        return;
      }

      res.download(attachment.filePath, attachment.originalName);
    } catch (error) {
      console.error('Download attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download attachment',
      });
    }
  }
}

export default new AttachmentController();