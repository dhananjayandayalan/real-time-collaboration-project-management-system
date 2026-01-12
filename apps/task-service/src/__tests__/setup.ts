import { afterEach, beforeAll } from 'vitest';
import prisma from '../config/prisma';

beforeAll(async () => {
  // Clean database before all tests
  await prisma.taskHistory.deleteMany({});
  await prisma.taskWatcher.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.task.deleteMany({});
});

afterEach(async () => {
  // Clean database after each test for isolation
  await prisma.taskHistory.deleteMany({});
  await prisma.taskWatcher.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.task.deleteMany({});
});