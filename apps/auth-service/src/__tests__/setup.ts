import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '../../node_modules/.prisma/auth-client';

// Create a test Prisma client
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db_test?schema=public',
    },
  },
});

// Setup hooks
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up database before each test
  // Delete in order to respect foreign key constraints
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
});

afterEach(async () => {
  // Clean up after each test
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
});