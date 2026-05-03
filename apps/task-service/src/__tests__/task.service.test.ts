import { describe, it, expect } from 'vitest';
import taskService from '../services/task.service';
import { createTestTaskData, generateUniqueId } from './helpers';
import { TaskStatus } from '../../node_modules/.prisma/task-client';
import prisma from '../config/prisma';

describe('Task Service', () => {
  describe('createTask', () => {
    it('should create a task with generated task ID', async () => {
      const taskData = createTestTaskData();

      const task = await taskService.createTask(taskData);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.taskId).toMatch(/^TEST-\d+$/);
      expect(task.title).toBe(taskData.title);
      expect(task.projectId).toBe(taskData.projectId);
      expect(task.status).toBe(TaskStatus.TODO);
    });

    it('should generate sequential task IDs for the same project', async () => {
      const projectKey = `PROJ${generateUniqueId()}`;
      const taskData1 = createTestTaskData({ projectKey });
      const taskData2 = createTestTaskData({ projectKey });

      const task1 = await taskService.createTask(taskData1);
      const task2 = await taskService.createTask(taskData2);

      expect(task1.taskId).toBe(`${projectKey}-1`);
      expect(task2.taskId).toBe(`${projectKey}-2`);
    });

    it('should create history entry on task creation', async () => {
      const taskData = createTestTaskData();

      const task = await taskService.createTask(taskData);

      const history = await prisma.taskHistory.findMany({
        where: { taskId: task.id },
      });

      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('created');
    });

    it('should auto-watch reporter on task creation', async () => {
      const taskData = createTestTaskData();

      const task = await taskService.createTask(taskData);

      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: task.id },
      });

      expect(watchers).toHaveLength(1);
      expect(watchers[0].userId).toBe(taskData.reporterId);
    });

    it('should auto-watch assignee on task creation', async () => {
      const assigneeId = `assignee-${generateUniqueId()}`;
      const taskData = createTestTaskData({ assigneeId });

      const task = await taskService.createTask(taskData);

      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: task.id },
      });

      expect(watchers).toHaveLength(2);
      expect(watchers.map(w => w.userId)).toContain(assigneeId);
      expect(watchers.map(w => w.userId)).toContain(taskData.reporterId);
    });
  });

  describe('getTasks', () => {
    it('should get all tasks without filters', async () => {
      const taskData1 = createTestTaskData();
      const taskData2 = createTestTaskData();

      await taskService.createTask(taskData1);
      await taskService.createTask(taskData2);

      const tasks = await taskService.getTasks({});

      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter tasks by project ID', async () => {
      const projectId = `project-${generateUniqueId()}`;
      const taskData1 = createTestTaskData({ projectId });
      const taskData2 = createTestTaskData();

      await taskService.createTask(taskData1);
      await taskService.createTask(taskData2);

      const tasks = await taskService.getTasks({ projectId });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].projectId).toBe(projectId);
    });

    it('should filter tasks by status', async () => {
      const taskData = createTestTaskData({ status: TaskStatus.IN_PROGRESS });

      await taskService.createTask(taskData);

      const tasks = await taskService.getTasks({ status: TaskStatus.IN_PROGRESS });

      expect(tasks.length).toBeGreaterThanOrEqual(1);
      expect(tasks[0].status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should filter tasks by assignee', async () => {
      const assigneeId = `assignee-${generateUniqueId()}`;
      const taskData = createTestTaskData({ assigneeId });

      await taskService.createTask(taskData);

      const tasks = await taskService.getTasks({ assigneeId });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].assigneeId).toBe(assigneeId);
    });

    it('should search tasks by title', async () => {
      const uniqueTitle = `UniqueTitle-${generateUniqueId()}`;
      const taskData = createTestTaskData({ title: uniqueTitle });

      await taskService.createTask(taskData);

      const tasks = await taskService.getTasks({ search: uniqueTitle });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe(uniqueTitle);
    });

    it('should filter tasks by tags', async () => {
      const tags = ['urgent', 'backend'];
      const taskData = createTestTaskData({ tags });

      await taskService.createTask(taskData);

      const tasks = await taskService.getTasks({ tags: ['urgent'] });

      expect(tasks.length).toBeGreaterThanOrEqual(1);
      expect(tasks[0].tags).toContain('urgent');
    });
  });

  describe('getTaskById', () => {
    it('should get task by ID', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);

      const task = await taskService.getTaskById(createdTask.id);

      expect(task).toBeDefined();
      expect(task?.id).toBe(createdTask.id);
    });

    it('should return null for non-existent task', async () => {
      const task = await taskService.getTaskById('non-existent-id');

      expect(task).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update task fields', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);

      const updatedTask = await taskService.updateTask(
        createdTask.id,
        { title: 'Updated Title', status: TaskStatus.DONE },
        taskData.reporterId
      );

      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.status).toBe(TaskStatus.DONE);
    });

    it('should create history entry for field changes', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);

      await taskService.updateTask(
        createdTask.id,
        { status: TaskStatus.DONE },
        taskData.reporterId
      );

      const history = await prisma.taskHistory.findMany({
        where: {
          taskId: createdTask.id,
          action: 'updated',
        },
      });

      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].fieldName).toBe('status');
      expect(history[0].oldValue).toBe(TaskStatus.TODO);
      expect(history[0].newValue).toBe(TaskStatus.DONE);
    });

    it('should auto-watch new assignee', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);
      const newAssigneeId = `new-assignee-${generateUniqueId()}`;

      await taskService.updateTask(
        createdTask.id,
        { assigneeId: newAssigneeId },
        taskData.reporterId
      );

      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: createdTask.id },
      });

      expect(watchers.map(w => w.userId)).toContain(newAssigneeId);
    });
  });

  describe('deleteTask', () => {
    it('should delete task and related data', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);

      await taskService.deleteTask(createdTask.id);

      const task = await taskService.getTaskById(createdTask.id);
      expect(task).toBeNull();
    });
  });

  describe('watcher management', () => {
    it('should add watcher to task', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);
      const watcherId = `watcher-${generateUniqueId()}`;

      await taskService.addWatcher(createdTask.id, watcherId, taskData.reporterId);

      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: createdTask.id },
      });

      expect(watchers.map(w => w.userId)).toContain(watcherId);
    });

    it('should not add duplicate watcher', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);

      // Try to add reporter again (already auto-watched)
      await taskService.addWatcher(createdTask.id, taskData.reporterId, taskData.reporterId);

      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: createdTask.id, userId: taskData.reporterId },
      });

      expect(watchers).toHaveLength(1);
    });

    it('should remove watcher from task', async () => {
      const taskData = createTestTaskData();
      const createdTask = await taskService.createTask(taskData);
      const watcherId = `watcher-${generateUniqueId()}`;

      await taskService.addWatcher(createdTask.id, watcherId, taskData.reporterId);
      await taskService.removeWatcher(createdTask.id, watcherId);

      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: createdTask.id, userId: watcherId },
      });

      expect(watchers).toHaveLength(0);
    });
  });
});