import { Router } from 'express';
import taskController from '../controllers/task.controller';
import attachmentController from '../controllers/attachment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

const router = Router();

// All task routes require authentication
// Task CRUD
router.post('/', authenticateToken, taskController.createTask.bind(taskController));
router.get('/', authenticateToken, taskController.getTasks.bind(taskController));
router.get('/:id', authenticateToken, taskController.getTaskById.bind(taskController));
router.patch('/:id', authenticateToken, taskController.updateTask.bind(taskController));
router.delete('/:id', authenticateToken, taskController.deleteTask.bind(taskController));

// Task comments
router.post('/:id/comments', authenticateToken, taskController.addComment.bind(taskController));
router.get('/:id/comments', authenticateToken, taskController.getComments.bind(taskController));
router.patch('/:id/comments/:commentId', authenticateToken, taskController.updateComment.bind(taskController));
router.delete('/:id/comments/:commentId', authenticateToken, taskController.deleteComment.bind(taskController));

// Task attachments
router.post('/:id/attachments', authenticateToken, upload.single('file'), attachmentController.uploadAttachment.bind(attachmentController));
router.get('/:id/attachments', authenticateToken, attachmentController.getAttachments.bind(attachmentController));
router.get('/:id/attachments/:attachmentId/download', authenticateToken, attachmentController.downloadAttachment.bind(attachmentController));
router.delete('/:id/attachments/:attachmentId', authenticateToken, attachmentController.deleteAttachment.bind(attachmentController));

// Task watchers
router.post('/:id/watchers', authenticateToken, taskController.addWatcher.bind(taskController));
router.delete('/:id/watchers/:userId', authenticateToken, taskController.removeWatcher.bind(taskController));

// Task history
router.get('/:id/history', authenticateToken, taskController.getTaskHistory.bind(taskController));

export default router;