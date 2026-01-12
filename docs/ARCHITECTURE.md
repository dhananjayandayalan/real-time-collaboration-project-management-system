# Microservices Architecture Documentation

This document describes the architectural patterns and design principles used across all microservices in the Real-Time Collaboration Project Management System.

---

## Table of Contents

1. [Overview](#overview)
2. [Layered Architecture](#layered-architecture)
3. [Architectural Patterns](#architectural-patterns)
4. [File Structure](#file-structure)
5. [Design Principles](#design-principles)
6. [Communication Patterns](#communication-patterns)
7. [Technology Stack](#technology-stack)
8. [Best Practices](#best-practices)

---

## Overview

Our system follows a **Microservices Architecture** where each service is independently deployable, scalable, and maintainable. Each microservice implements a **3-Tier Layered Architecture** with clear separation of concerns.

### Core Microservices

- **Auth Service** (Port 3001): User authentication and authorization
- **Project Service** (Port 3002): Workspace and project management
- **Task Service** (Port 3003): Task/issue management with comments and attachments
- **Real-time Service** (Port 3004): WebSocket server for real-time updates

---

## Layered Architecture

Each microservice follows a **3-Tier Layered Architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Routes Layer (*.routes.ts)                      │  │
│  │  • Define HTTP endpoints                         │  │
│  │  • Apply middleware chains                       │  │
│  │  • Map URLs to controllers                       │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────────┐  │
│  │  Controllers Layer (*.controller.ts)             │  │
│  │  • Parse HTTP request                            │  │
│  │  • Validate input with Joi schemas               │  │
│  │  • Call appropriate services                     │  │
│  │  • Format HTTP response                          │  │
│  │  • Handle HTTP-specific errors                   │  │
│  └────────────────┬─────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Services Layer (*.service.ts)                   │  │
│  │  • Implement business logic                      │  │
│  │  • Enforce domain rules                          │  │
│  │  • Orchestrate multiple operations               │  │
│  │  • Call other services when needed               │  │
│  │  • Publish events to Redis                       │  │
│  │  • Transaction management                        │  │
│  └────────────────┬─────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│                   DATA ACCESS LAYER                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Prisma Client (ORM)                             │  │
│  │  • CRUD operations                               │  │
│  │  • Query building                                │  │
│  │  • Database transactions                         │  │
│  │  • Type-safe database access                     │  │
│  └────────────────┬─────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────┘
                    │
          ┌─────────▼──────────┐
          │   PostgreSQL DB    │
          │  (via Prisma ORM)  │
          └────────────────────┘
```

### Cross-Cutting Concerns

These are handled outside the main layers:

```
┌─────────────────────────────────────────────────────────┐
│              CROSS-CUTTING CONCERNS                     │
├─────────────────────────────────────────────────────────┤
│  • Middleware (auth, validation, upload, error)         │
│  • Configuration (database, redis, environment)         │
│  • Validation Schemas (Joi)                             │
│  • Event Publishing/Subscribing (Redis Pub/Sub)         │
│  • Logging and Monitoring                               │
│  • Error Handling                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Architectural Patterns

### 1. Service Layer Pattern

**Purpose**: Encapsulate business logic in service classes.

**Implementation**:
```typescript
// Service is a singleton with clear responsibilities
class TaskService {
  /**
   * Create a new task with business rules
   */
  async createTask(data: CreateTaskDto): Promise<Task> {
    // Business logic: Generate unique task ID
    const taskId = await this.generateTaskId(data.projectKey);

    // Create task in database
    const task = await prisma.task.create({
      data: { ...data, taskId }
    });

    // Business rule: Auto-watch reporter and assignee
    await this.addWatcher(task.id, data.reporterId, data.reporterId);
    if (data.assigneeId) {
      await this.addWatcher(task.id, data.assigneeId, data.reporterId);
    }

    // Create audit trail
    await taskHistoryService.createHistoryEntry({
      taskId: task.id,
      userId: data.reporterId,
      action: 'created',
      fieldName: null,
      oldValue: null,
      newValue: null,
    });

    // Publish event for real-time updates
    await this.publishEvent('task:created', task);

    return task;
  }

  // Private helper for event publishing
  private async publishEvent(event: string, data: any): Promise<void> {
    try {
      await redisPublisher.publish(event, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }
}

// Export as singleton
export default new TaskService();
```

**Benefits**:
- Business logic is centralized and reusable
- Easy to test in isolation
- Can be called from multiple controllers
- Maintains single source of truth

### 2. Repository Pattern (via Prisma)

**Purpose**: Abstract data access logic.

**Implementation**:
```typescript
// Instead of raw SQL, use Prisma as repository
await prisma.task.create({ data });
await prisma.task.findMany({ where: filters });
await prisma.task.update({ where: { id }, data });
await prisma.task.delete({ where: { id } });

// Complex queries with relations
await prisma.task.findUnique({
  where: { id },
  include: {
    comments: true,
    attachments: true,
    watchers: true,
    history: { orderBy: { createdAt: 'desc' } }
  }
});
```

**Benefits**:
- Type-safe database queries
- Easy to mock for testing
- Database-agnostic (can switch databases)
- Migration management built-in

### 3. DTO (Data Transfer Object) Pattern

**Purpose**: Define clear contracts for data transfer between layers.

**Implementation**:
```typescript
// Input DTOs define what data comes in
export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: string;
  projectKey: string;
  reporterId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate?: Date;
  tags?: string[];
}

// Update DTOs define what can be changed
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  tags?: string[];
}
```

**Benefits**:
- Clear API contracts
- Type safety with TypeScript
- Easy validation with Joi
- Documentation for API consumers

### 4. Middleware Pattern

**Purpose**: Handle cross-cutting concerns in the request pipeline.

**Implementation**:
```typescript
// Authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// File upload middleware
const upload = multer({
  storage: diskStorage,
  fileFilter: fileTypeFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Apply middleware in routes
router.post('/', authenticateToken, taskController.createTask);
router.post('/:id/attachments', authenticateToken, upload.single('file'), attachmentController.upload);
```

**Benefits**:
- Reusable across routes
- Keeps controllers clean
- Easy to test independently
- Clear separation of concerns

### 5. Event-Driven Architecture

**Purpose**: Enable loose coupling between microservices.

**Implementation**:
```typescript
// Publisher (Task Service)
class TaskService {
  private async publishEvent(event: string, data: any): Promise<void> {
    await redisPublisher.publish(event, JSON.stringify(data));
  }

  async createTask(data: CreateTaskDto): Promise<Task> {
    const task = await prisma.task.create({ data });
    await this.publishEvent('task:created', task);
    return task;
  }
}

// Subscriber (Real-time Service - Phase 4)
redisSubscriber.subscribe('task:created');
redisSubscriber.on('message', (channel, message) => {
  const task = JSON.parse(message);

  // Broadcast to WebSocket clients in the project room
  io.to(`project:${task.projectId}`).emit('task:created', task);
});
```

**Benefits**:
- Services don't directly depend on each other
- Async processing
- Easy to add new subscribers
- Scalable architecture

### 6. Singleton Pattern

**Purpose**: Ensure only one instance of services exists.

**Implementation**:
```typescript
// Define service class
class TaskService {
  async createTask(data: CreateTaskDto): Promise<Task> {
    // implementation
  }
}

// Export as singleton
export default new TaskService();

// Usage in controllers
import taskService from '../services/task.service';
await taskService.createTask(data);
```

**Benefits**:
- Shared state if needed
- Consistent behavior across application
- Easy to mock in tests

---

## File Structure

Every microservice follows this consistent structure:

```
apps/[service-name]/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data
│
├── src/
│   ├── config/                 # Configuration files
│   │   ├── prisma.ts          # Prisma client setup
│   │   └── redis.ts           # Redis client setup
│   │
│   ├── controllers/            # HTTP request handlers
│   │   ├── task.controller.ts
│   │   └── attachment.controller.ts
│   │
│   ├── services/               # Business logic
│   │   ├── task.service.ts
│   │   ├── taskComment.service.ts
│   │   ├── taskAttachment.service.ts
│   │   └── taskHistory.service.ts
│   │
│   ├── middleware/             # Cross-cutting concerns
│   │   ├── auth.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── errorHandler.middleware.ts
│   │
│   ├── routes/                 # Route definitions
│   │   └── task.routes.ts
│   │
│   ├── utils/                  # Utilities and helpers
│   │   ├── validation.ts      # Joi validation schemas
│   │   └── helpers.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── __tests__/              # Tests
│   │   ├── setup.ts           # Test configuration
│   │   ├── helpers.ts         # Test helpers
│   │   ├── task.service.test.ts
│   │   ├── taskComment.service.test.ts
│   │   └── taskAttachment.service.test.ts
│   │
│   └── index.ts                # Entry point
│
├── .env.example                # Environment variables template
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Test configuration
└── README.md                   # Service documentation
```

### Naming Conventions

- **Files**: camelCase with appropriate suffix
  - Controllers: `*.controller.ts`
  - Services: `*.service.ts`
  - Routes: `*.routes.ts`
  - Middleware: `*.middleware.ts`
  - Tests: `*.test.ts`

- **Classes**: PascalCase
  - `TaskController`, `TaskService`, `TaskCommentService`

- **Interfaces**: PascalCase with descriptive names
  - `CreateTaskDto`, `UpdateTaskDto`, `TaskFilters`

- **Functions**: camelCase with verb prefix
  - `createTask`, `updateTask`, `deleteTask`

---

## Design Principles

### 1. Separation of Concerns (SoC)

Each layer has a single, well-defined responsibility:

- **Routes**: Define endpoints and middleware chains
- **Controllers**: Handle HTTP request/response
- **Services**: Implement business logic
- **Prisma**: Manage data access

**Example**:
```typescript
// ❌ Bad: Business logic in controller
async createTask(req: Request, res: Response) {
  const taskId = `${req.body.projectKey}-${Date.now()}`;
  const task = await prisma.task.create({ data: { ...req.body, taskId } });
  await prisma.taskHistory.create({ data: { taskId: task.id, action: 'created' } });
  res.json(task);
}

// ✅ Good: Business logic in service
async createTask(req: Request, res: Response) {
  const task = await taskService.createTask(req.body);
  res.json(task);
}
```

### 2. Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not concrete implementations.

```typescript
// Controller depends on service interface, not implementation
class TaskController {
  async createTask(req: Request, res: Response) {
    // Depends on taskService abstraction
    const task = await taskService.createTask(req.body);
    res.json(task);
  }
}

// Service can be easily swapped or mocked
const mockTaskService = {
  createTask: vi.fn().mockResolvedValue(mockTask)
};
```

### 3. Single Responsibility Principle (SRP)

Each class/module has one reason to change:

- `TaskService`: Task CRUD and business rules
- `TaskCommentService`: Comment operations
- `TaskAttachmentService`: File attachment management
- `TaskHistoryService`: Activity tracking

### 4. Don't Repeat Yourself (DRY)

Common functionality is abstracted:

```typescript
// Shared middleware
export const authenticateToken = (req, res, next) => { /* ... */ };

// Shared validation schemas
export const createTaskSchema = Joi.object({ /* ... */ });

// Shared types (in packages/shared)
export interface User { /* ... */ }
```

### 5. Open/Closed Principle

Software entities should be open for extension but closed for modification:

```typescript
// Base service with common functionality
class BaseService {
  protected async publishEvent(event: string, data: any) {
    await redisPublisher.publish(event, JSON.stringify(data));
  }
}

// Extended for specific use case
class TaskService extends BaseService {
  async createTask(data: CreateTaskDto) {
    const task = await prisma.task.create({ data });
    await this.publishEvent('task:created', task); // Use inherited method
    return task;
  }
}
```

### 6. Dependency Injection (DI)

Dependencies are injected rather than hardcoded:

```typescript
// Configuration is injected via environment variables
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Services receive configuration
const redisClient = createClient({
  url: process.env.REDIS_URL
});
```

---

## Communication Patterns

### 1. Synchronous Communication (HTTP)

**When to Use**: When you need an immediate response.

**Example**: Task Service verifying project exists in Project Service

```typescript
// Task Service calls Project Service
const projectCheck = await axios.get(
  `${PROJECT_SERVICE_URL}/api/projects/${projectId}`,
  { headers: { Authorization: token } }
);

if (!projectCheck.data.success) {
  throw new Error('Project not found');
}
```

**Pros**: Simple, immediate feedback
**Cons**: Creates coupling, can fail if service is down

### 2. Asynchronous Communication (Events via Redis)

**When to Use**: When you don't need immediate response or want to notify multiple services.

**Example**: Task Service publishes events, Real-time Service subscribes

```typescript
// Publisher (Task Service)
await redisPublisher.publish('task:created', JSON.stringify(task));

// Subscriber (Real-time Service)
redisSubscriber.subscribe('task:created');
redisSubscriber.on('message', (channel, message) => {
  const task = JSON.parse(message);
  io.to(`project:${task.projectId}`).emit('task:created', task);
});
```

**Pros**: Loose coupling, fault tolerant, scalable
**Cons**: Eventual consistency, harder to debug

### 3. Event Types

| Event | Publisher | Subscribers | Purpose |
|-------|-----------|-------------|---------|
| `task:created` | Task Service | Real-time Service | Notify clients of new task |
| `task:updated` | Task Service | Real-time Service | Notify clients of task changes |
| `task:deleted` | Task Service | Real-time Service | Notify clients of task deletion |
| `task:comment:added` | Task Service | Real-time Service | Notify clients of new comment |

---

## Technology Stack

### Backend

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Type safety and better DX
- **Prisma**: ORM for type-safe database access
- **PostgreSQL**: Relational database
- **Redis**: Caching and pub/sub messaging
- **JWT**: Authentication tokens
- **Joi**: Input validation
- **Multer**: File uploads
- **Socket.io**: Real-time WebSocket communication

### Testing

- **Vitest**: Fast unit testing framework
- **Supertest**: HTTP integration testing
- **ts-node**: TypeScript execution for Node.js

### DevOps

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: API gateway and reverse proxy

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
// In services
async createTask(data: CreateTaskDto): Promise<Task> {
  try {
    const task = await prisma.task.create({ data });
    return task;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw new Error('Failed to create task');
  }
}

// In controllers
async createTask(req: Request, res: Response): Promise<void> {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
```

### 2. Input Validation

Validate all inputs with Joi schemas:

```typescript
const createTaskSchema = Joi.object({
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().allow('').max(5000),
  projectId: Joi.string().required().uuid(),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE'),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
});

// In controller
const { error, value } = createTaskSchema.validate(req.body);
if (error) {
  return res.status(400).json({ message: error.details[0].message });
}
```

### 3. Database Transactions

Use transactions for operations that modify multiple tables:

```typescript
async deleteTask(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Delete all related data
    await tx.taskHistory.deleteMany({ where: { taskId: id } });
    await tx.taskWatcher.deleteMany({ where: { taskId: id } });
    await tx.taskComment.deleteMany({ where: { taskId: id } });
    await tx.taskAttachment.deleteMany({ where: { taskId: id } });

    // Delete the task
    await tx.task.delete({ where: { id } });
  });
}
```

### 4. Controller Method Binding

Always bind controller methods to preserve `this` context:

```typescript
// ❌ Wrong: Loses `this` context
router.post('/', authenticateToken, taskController.createTask);

// ✅ Correct: Preserves `this` context
router.post('/', authenticateToken, taskController.createTask.bind(taskController));
```

### 5. Environment Variables

Never hardcode configuration:

```typescript
// ❌ Bad
const db = new PrismaClient({ datasource: { url: 'postgresql://...' } });

// ✅ Good
const db = new PrismaClient({ datasource: { url: process.env.DATABASE_URL } });
```

### 6. Logging

Use consistent logging:

```typescript
// Service startup
console.log(`Task service running on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

// Errors
console.error('Failed to create task:', error);

// Events
console.log('Published task:created event for task:', task.id);
```

### 7. Testing Best Practices

- Write tests for all services
- Use setup/teardown for database cleanup
- Use factories for test data
- Test business logic, not implementation details

```typescript
describe('TaskService', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany({});
  });

  it('should create task with generated ID', async () => {
    const taskData = createTestTaskData();
    const task = await taskService.createTask(taskData);

    expect(task.taskId).toMatch(/^TEST-\d+$/);
  });
});
```

### 8. Code Organization

- Keep files focused and small (<300 lines)
- One class per file
- Group related functionality
- Use barrel exports (index.ts) for clean imports

### 9. Type Safety

Leverage TypeScript for type safety:

```typescript
// Define types for all DTOs
interface CreateTaskDto { /* ... */ }

// Use Prisma types
import { Task, TaskStatus } from '@prisma/client';

// Type function parameters and returns
async createTask(data: CreateTaskDto): Promise<Task> { /* ... */ }
```

### 10. Documentation

Document complex business logic:

```typescript
/**
 * Generate sequential task ID for a project
 * Format: {PROJECT_KEY}-{NUMBER}
 * Example: PROJ-123
 */
async generateTaskId(projectKey: string): Promise<string> {
  const count = await prisma.task.count({
    where: { taskId: { startsWith: `${projectKey}-` } }
  });
  return `${projectKey}-${count + 1}`;
}
```

---

## Summary

This architecture provides:

✅ **Clear separation of concerns** - Each layer has a single responsibility
✅ **Loose coupling** - Services communicate via events
✅ **High cohesion** - Related functionality grouped together
✅ **Testability** - Each layer can be tested independently
✅ **Maintainability** - Consistent structure across all services
✅ **Scalability** - Services can scale independently
✅ **Type safety** - TypeScript and Prisma provide compile-time checks
✅ **Developer experience** - Clear patterns and conventions

By following these patterns and principles, we ensure a robust, maintainable, and scalable microservices architecture.
