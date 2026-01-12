import { describe, it, expect } from 'vitest';
import taskCommentService from '../services/taskComment.service';
import taskService from '../services/task.service';
import { createTestTaskData, createTestCommentData, generateUniqueId } from './helpers';
import prisma from '../config/prisma';

describe('TaskComment Service', () => {
  describe('createComment', () => {
    it('should create a comment on a task', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData = createTestCommentData(task.id);

      const comment = await taskCommentService.createComment(commentData);

      expect(comment).toBeDefined();
      expect(comment.id).toBeDefined();
      expect(comment.taskId).toBe(task.id);
      expect(comment.content).toBe(commentData.content);
      expect(comment.userId).toBe(commentData.userId);
    });

    it('should create history entry on comment creation', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData = createTestCommentData(task.id);

      await taskCommentService.createComment(commentData);

      const history = await prisma.taskHistory.findMany({
        where: {
          taskId: task.id,
          action: 'commented',
        },
      });

      expect(history).toHaveLength(1);
    });
  });

  describe('getComments', () => {
    it('should get all comments for a task', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData1 = createTestCommentData(task.id);
      const commentData2 = createTestCommentData(task.id);

      await taskCommentService.createComment(commentData1);
      await taskCommentService.createComment(commentData2);

      const comments = await taskCommentService.getComments(task.id);

      expect(comments).toHaveLength(2);
    });

    it('should return comments in ascending order by creation date', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData1 = createTestCommentData(task.id, { content: 'First comment' });
      const commentData2 = createTestCommentData(task.id, { content: 'Second comment' });

      const comment1 = await taskCommentService.createComment(commentData1);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const comment2 = await taskCommentService.createComment(commentData2);

      const comments = await taskCommentService.getComments(task.id);

      expect(comments[0].id).toBe(comment1.id);
      expect(comments[1].id).toBe(comment2.id);
    });

    it('should return empty array for task with no comments', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);

      const comments = await taskCommentService.getComments(task.id);

      expect(comments).toHaveLength(0);
    });
  });

  describe('getCommentById', () => {
    it('should get comment by ID', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData = createTestCommentData(task.id);
      const createdComment = await taskCommentService.createComment(commentData);

      const comment = await taskCommentService.getCommentById(createdComment.id);

      expect(comment).toBeDefined();
      expect(comment?.id).toBe(createdComment.id);
    });

    it('should return null for non-existent comment', async () => {
      const comment = await taskCommentService.getCommentById('non-existent-id');

      expect(comment).toBeNull();
    });
  });

  describe('updateComment', () => {
    it('should update comment content', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData = createTestCommentData(task.id);
      const createdComment = await taskCommentService.createComment(commentData);

      const updatedComment = await taskCommentService.updateComment(
        createdComment.id,
        { content: 'Updated content' },
        commentData.userId
      );

      expect(updatedComment.content).toBe('Updated content');
    });
  });

  describe('deleteComment', () => {
    it('should delete comment', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData = createTestCommentData(task.id);
      const createdComment = await taskCommentService.createComment(commentData);

      await taskCommentService.deleteComment(createdComment.id);

      const comment = await taskCommentService.getCommentById(createdComment.id);
      expect(comment).toBeNull();
    });
  });

  describe('checkCommentOwnership', () => {
    it('should return true for comment owner', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const userId = `user-${generateUniqueId()}`;
      const commentData = createTestCommentData(task.id, { userId });
      const createdComment = await taskCommentService.createComment(commentData);

      const isOwner = await taskCommentService.checkCommentOwnership(createdComment.id, userId);

      expect(isOwner).toBe(true);
    });

    it('should return false for non-owner', async () => {
      const taskData = createTestTaskData();
      const task = await taskService.createTask(taskData);
      const commentData = createTestCommentData(task.id);
      const createdComment = await taskCommentService.createComment(commentData);

      const isOwner = await taskCommentService.checkCommentOwnership(
        createdComment.id,
        `different-user-${generateUniqueId()}`
      );

      expect(isOwner).toBe(false);
    });
  });
});
