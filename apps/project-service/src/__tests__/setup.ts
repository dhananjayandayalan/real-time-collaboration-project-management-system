import { afterAll, beforeAll, afterEach } from 'vitest';
import prisma from '../config/prisma';

beforeAll(async () => {
  // Setup test database - ensure clean state
  console.log('Test setup started');

  // Clear all test data before starting
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspace.deleteMany({});
});

afterEach(async () => {
  // Clean up after each test to ensure isolation
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspace.deleteMany({});
});

afterAll(async () => {
  // Final cleanup and disconnect
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.$disconnect();
  console.log('Test cleanup completed');
});
