# Real-Time Collaboration Project Management System - Architecture

## System Overview

A real-time collaboration project management system (similar to Jira) built with a monorepo architecture containing multiple microservices on the backend and a React frontend.

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- Redux Toolkit (state management)
- Vanilla CSS (styling)
- Vitest + React Testing Library (testing)
- Socket.io Client (real-time)

**Backend:**
- Node.js + Express with TypeScript
- Microservices architecture
- Prisma ORM
- PostgreSQL (primary database)
- Redis (caching, pub/sub, sessions)
- Socket.io (WebSocket server)
- JWT (authentication)
- Vitest (testing)

**Infrastructure:**
- Docker & Docker Compose (development)
- Nginx (API Gateway)
- PM2 (process management)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  Redux Toolkit | Socket.io Client | Axios                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                          │
│              Load Balancing | Rate Limiting                     │
└─────┬───────────────┬───────────────┬──────────────┬────────────┘
      │               │               │              │
      ▼               ▼               ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│   Auth   │   │ Project  │   │  Task    │   │  Real-time   │
│ Service  │   │ Service  │   │ Service  │   │   Service    │
│  :3001   │   │  :3002   │   │  :3003   │   │   :3004      │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └──────┬───────┘
     │              │              │                 │
     │              │              │                 │
     ▼              ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                         │
│  - users, roles, permissions                                    │
│  - projects, workspaces                                         │
│  - tasks, comments, attachments                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Redis Cluster                           │
│  - Session storage                                              │
│  - Pub/Sub for real-time events                                │
│  - Caching layer                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Microservices Architecture

### 1. Auth Service (Port 3001)

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password reset and email verification
- Role-based access control (RBAC)
- Session management with Redis

**Database Tables:**
- `users` (id, email, password_hash, first_name, last_name, avatar_url, created_at, updated_at)
- `roles` (id, name, description)
- `permissions` (id, resource, action, description)
- `user_roles` (user_id, role_id, workspace_id)
- `role_permissions` (role_id, permission_id)

**Key Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

**Role Types:**
- `ADMIN` - Full system access
- `MANAGER` - Manage projects, assign tasks
- `DEVELOPER` - Create and update tasks
- `VIEWER` - Read-only access

---

### 2. Project Service (Port 3002)

**Responsibilities:**
- Workspace management
- Project CRUD operations
- Project members and permissions
- Project settings and configuration

**Database Tables:**
- `workspaces` (id, name, slug, owner_id, created_at, updated_at)
- `projects` (id, workspace_id, name, key, description, lead_id, status, created_at, updated_at)
- `project_members` (project_id, user_id, role_id, joined_at)

**Key Endpoints:**
- `POST /api/workspaces`
- `GET /api/workspaces`
- `GET /api/workspaces/:id`
- `PATCH /api/workspaces/:id`
- `DELETE /api/workspaces/:id`
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:userId`

---

### 3. Task Service (Port 3003)

**Responsibilities:**
- Task/Issue CRUD operations
- Task status management (TODO, IN_PROGRESS, DONE, etc.)
- Task assignments and watchers
- Comments and activity tracking
- Task attachments

**Database Tables:**
- `tasks` (id, project_id, title, description, status, priority, type, assignee_id, reporter_id, story_points, created_at, updated_at, due_date)
- `task_comments` (id, task_id, user_id, content, created_at, updated_at)
- `task_attachments` (id, task_id, user_id, file_name, file_url, file_size, created_at)
- `task_watchers` (task_id, user_id)
- `task_history` (id, task_id, user_id, field, old_value, new_value, changed_at)

**Task Statuses:**
- `TODO`
- `IN_PROGRESS`
- `IN_REVIEW`
- `DONE`
- `BLOCKED`

**Task Priorities:**
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

**Task Types:**
- `STORY`
- `TASK`
- `BUG`
- `EPIC`

**Key Endpoints:**
- `POST /api/tasks`
- `GET /api/tasks` (with filters: project, assignee, status, priority)
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/comments`
- `GET /api/tasks/:id/comments`
- `PATCH /api/tasks/:id/comments/:commentId`
- `DELETE /api/tasks/:id/comments/:commentId`
- `POST /api/tasks/:id/attachments`
- `DELETE /api/tasks/:id/attachments/:attachmentId`
- `POST /api/tasks/:id/watchers`
- `DELETE /api/tasks/:id/watchers/:userId`

---

### 4. Real-time Service (Port 3004)

**Responsibilities:**
- WebSocket connections via Socket.io
- Real-time event broadcasting
- User presence tracking
- Live task updates
- Collaborative editing notifications

**Redis Pub/Sub Events:**
- `task:created`
- `task:updated`
- `task:deleted`
- `task:comment:added`
- `user:presence:online`
- `user:presence:offline`
- `project:member:joined`

**Socket.io Events:**
- Client → Server:
  - `join:project` - Join project room
  - `leave:project` - Leave project room
  - `join:task` - Join task room
  - `typing:start` - User started typing
  - `typing:stop` - User stopped typing

- Server → Client:
  - `task:updated` - Task data changed
  - `task:created` - New task created
  - `task:deleted` - Task deleted
  - `comment:added` - New comment added
  - `user:online` - User came online
  - `user:offline` - User went offline
  - `typing:user` - User is typing

**Key Endpoints:**
- WebSocket: `ws://localhost:3004`
- `GET /api/realtime/health`

---

## Inter-Service Communication

### Event-Driven Architecture with Redis Pub/Sub

Services communicate asynchronously via Redis Pub/Sub for real-time updates:

**Example Flow:**
1. User updates task status via Task Service
2. Task Service updates database
3. Task Service publishes `task:updated` event to Redis
4. Real-time Service subscribed to Redis receives event
5. Real-time Service broadcasts to connected clients via Socket.io

### Direct HTTP Calls for Synchronous Operations

Services make direct HTTP calls when immediate response is needed:

**Example Flow:**
1. Task Service needs to validate user permissions
2. Task Service makes HTTP call to Auth Service
3. Auth Service validates JWT and checks permissions
4. Returns result synchronously

---

## Database Schema

### Shared Database vs. Database per Service

**Approach:** Single PostgreSQL database with schema separation

Each service has its own schema:
- `auth_schema` (Auth Service)
- `project_schema` (Project Service)
- `task_schema` (Task Service)

**Reasoning:**
- Simpler for portfolio project
- Easier transactions across services
- Prisma supports multi-schema
- Can migrate to separate DBs later if needed

### Database Relationships

```
users (auth_schema)
  ├── 1:N → user_roles
  ├── 1:N → workspaces (owner)
  ├── 1:N → projects (lead)
  ├── 1:N → tasks (assignee/reporter)
  └── 1:N → task_comments

workspaces (project_schema)
  ├── N:1 → users (owner)
  └── 1:N → projects

projects (project_schema)
  ├── N:1 → workspaces
  ├── N:1 → users (lead)
  ├── N:N → users (project_members)
  └── 1:N → tasks

tasks (task_schema)
  ├── N:1 → projects
  ├── N:1 → users (assignee)
  ├── N:1 → users (reporter)
  ├── 1:N → task_comments
  ├── 1:N → task_attachments
  ├── N:N → users (watchers)
  └── 1:N → task_history

task_comments (task_schema)
  ├── N:1 → tasks
  └── N:1 → users
```

---

## Monorepo Structure

```
real-time-collaboration-project-management-system/
├── apps/
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── common/
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── tasks/
│   │   │   │   └── layouts/
│   │   │   ├── features/       # Redux slices
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   └── tasks/
│   │   │   ├── hooks/
│   │   │   ├── services/       # API clients
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── vitest.config.ts
│   │
│   ├── auth-service/           # Auth microservice
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   ├── validators/
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── project-service/        # Project microservice
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── task-service/           # Task microservice
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── realtime-service/       # Real-time microservice
│       ├── src/
│       ├── tests/
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
│
├── packages/
│   ├── shared/                 # Shared code across services
│   │   ├── src/
│   │   │   ├── types/          # Common TypeScript types
│   │   │   ├── constants/      # Shared constants
│   │   │   ├── utils/          # Shared utilities
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── eslint-config/          # Shared ESLint config
│       └── package.json
│
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── postgres/
│   │   └── init.sql
│   └── redis/
│       └── redis.conf
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .dockerignore
├── .gitignore
├── package.json                # Root package.json
├── turbo.json                  # Turborepo config (optional)
├── README.md
└── ARCHITECTURE.md
```

---

## Development Workflow

### Local Development Setup

1. **Prerequisites:**
   ```bash
   node >= 18.x
   npm >= 9.x
   docker & docker-compose
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start infrastructure:**
   ```bash
   docker-compose up -d postgres redis nginx
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate:dev
   ```

5. **Start all services:**
   ```bash
   npm run dev
   ```

### NPM Scripts (Root level)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:auth\" \"npm run dev:project\" \"npm run dev:task\" \"npm run dev:realtime\" \"npm run dev:client\"",
    "dev:auth": "npm run dev --workspace=apps/auth-service",
    "dev:project": "npm run dev --workspace=apps/project-service",
    "dev:task": "npm run dev --workspace=apps/task-service",
    "dev:realtime": "npm run dev --workspace=apps/realtime-service",
    "dev:client": "npm run dev --workspace=apps/client",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "migrate:dev": "npm run migrate:dev --workspaces --if-present",
    "lint": "npm run lint --workspaces",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

---

## Security Best Practices

### Authentication & Authorization

1. **JWT Strategy:**
   - Short-lived access tokens (15 min)
   - Refresh tokens stored in Redis (7 days)
   - HTTP-only cookies for tokens
   - CSRF protection

2. **Password Security:**
   - bcrypt with salt rounds = 12
   - Password complexity requirements
   - Rate limiting on login attempts

3. **Role-Based Access Control (RBAC):**
   - Middleware validates permissions per endpoint
   - Resource-level permissions (e.g., can edit own tasks)
   - Workspace/project-level role assignments

### API Security

1. **Rate Limiting:**
   - Redis-based rate limiter
   - Different limits per endpoint type
   - IP-based and user-based limiting

2. **Input Validation:**
   - Zod for request validation
   - Sanitize all inputs
   - Parameterized queries (Prisma handles this)

3. **CORS Configuration:**
   - Whitelist specific origins
   - Credentials allowed for authenticated requests

4. **Helmet.js:**
   - Security headers
   - XSS protection
   - Content Security Policy

### Database Security

1. **Prisma ORM:**
   - Automatic SQL injection prevention
   - Type-safe queries
   - Connection pooling

2. **Environment Variables:**
   - Never commit .env files
   - Use different credentials per environment
   - Rotate secrets regularly

---

## Testing Strategy

### Unit Tests

- Test individual functions and services
- Mock external dependencies
- Use Vitest for both frontend and backend
- Target: 80%+ code coverage

### Integration Tests

- Test API endpoints end-to-end
- Use test database
- Test authentication flows
- Test service-to-service communication

### E2E Tests (Future)

- Playwright or Cypress
- Test critical user flows
- Run in CI/CD pipeline

### Test Structure Example

```typescript
// apps/task-service/tests/task.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from '../src/services/task.service';

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
  });

  describe('createTask', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        projectId: '123',
        assigneeId: '456'
      };
      const result = await taskService.createTask(taskData);
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test Task');
    });

    it('should throw error if project does not exist', async () => {
      const taskData = {
        title: 'Test Task',
        projectId: 'invalid',
        assigneeId: '456'
      };
      await expect(taskService.createTask(taskData)).rejects.toThrow();
    });
  });
});
```

---

## Coding Best Practices

### TypeScript

1. **Strict Mode:**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Type Definitions:**
   - Define interfaces for all data structures
   - Use shared types from `packages/shared`
   - Avoid `any` type
   - Use generics where appropriate

3. **Naming Conventions:**
   - PascalCase for types, interfaces, classes
   - camelCase for variables, functions
   - SCREAMING_SNAKE_CASE for constants
   - Descriptive names (no abbreviations)

### Code Organization

1. **Single Responsibility:**
   - Each function/class has one job
   - Controllers handle HTTP logic
   - Services handle business logic
   - Repositories handle data access

2. **DRY (Don't Repeat Yourself):**
   - Extract common logic to utilities
   - Use shared packages for cross-service code
   - Create reusable React components

3. **Error Handling:**
   ```typescript
   // Custom error classes
   class NotFoundError extends Error {
     statusCode = 404;
   }

   // Centralized error handler middleware
   app.use(errorHandler);
   ```

4. **Dependency Injection:**
   ```typescript
   class TaskService {
     constructor(
       private taskRepository: TaskRepository,
       private eventPublisher: EventPublisher
     ) {}
   }
   ```

### React Best Practices

1. **Component Structure:**
   - Functional components with hooks
   - Custom hooks for reusable logic
   - Props validation with TypeScript

2. **State Management:**
   - Redux Toolkit for global state
   - Local state for component-specific data
   - React Query for server state (optional)

3. **Performance:**
   - useMemo for expensive calculations
   - useCallback for function props
   - React.memo for expensive renders
   - Code splitting with lazy loading

### Git Workflow

1. **Branch Naming:**
   - `feature/add-task-comments`
   - `bugfix/fix-auth-redirect`
   - `refactor/improve-task-service`

2. **Commit Messages:**
   - Conventional Commits format
   - `feat: add task comment functionality`
   - `fix: resolve authentication bug`
   - `refactor: improve task service structure`

3. **PR Process:**
   - Small, focused PRs
   - Code review required
   - All tests must pass
   - No merge conflicts

---

## Deployment Strategy

### Docker Containers

Each service runs in its own container:

```yaml
# docker-compose.prod.yml
services:
  auth-service:
    build: ./apps/auth-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  # ... other services
```

### Environment-Specific Configs

- **Development:** docker-compose.yml
- **Production:** docker-compose.prod.yml
- **Environment variables:** .env files (not committed)

### Deployment Options

1. **VPS (DigitalOcean, AWS EC2):**
   - Docker Compose deployment
   - Nginx as reverse proxy
   - PM2 for process management
   - SSL with Let's Encrypt

2. **Container Orchestration (Future):**
   - Kubernetes
   - Docker Swarm
   - AWS ECS

3. **Frontend Deployment:**
   - Vercel or Netlify (easiest)
   - S3 + CloudFront
   - Nginx static file serving

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## Performance Optimization

### Backend

1. **Database:**
   - Proper indexing on frequently queried fields
   - Connection pooling
   - N+1 query prevention with Prisma include/select

2. **Caching:**
   - Redis for frequently accessed data
   - Cache invalidation strategy
   - Cache user sessions

3. **API:**
   - Pagination for list endpoints
   - Compression middleware (gzip)
   - Response size optimization

### Frontend

1. **Bundle Size:**
   - Code splitting
   - Lazy loading routes
   - Tree shaking
   - Production build optimization

2. **Rendering:**
   - Virtual scrolling for long lists
   - Debouncing search inputs
   - Optimistic UI updates

3. **Network:**
   - Request deduplication
   - WebSocket for real-time (vs polling)
   - Image optimization

---

## Monitoring & Logging

### Logging Strategy

1. **Structured Logging:**
   - Use Winston or Pino
   - JSON format for easy parsing
   - Log levels: error, warn, info, debug

2. **What to Log:**
   - API requests/responses
   - Database queries (slow queries)
   - Errors with stack traces
   - Authentication events
   - Real-time connection events

3. **Log Aggregation (Future):**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Datadog
   - CloudWatch

### Monitoring (Future)

- Application metrics (response times, error rates)
- Infrastructure metrics (CPU, memory, disk)
- Database metrics (connections, query performance)
- Real-time metrics (active connections, message throughput)

---

## Future Enhancements

After MVP, consider adding:

1. **Features:**
   - Sprints and backlog management
   - Task dependencies and blocking
   - Time tracking
   - File attachments (S3 integration)
   - Advanced search and filtering
   - Activity feeds
   - Email notifications
   - Custom workflows
   - Reports and dashboards
   - Mobile app (React Native)

2. **Technical:**
   - GraphQL API layer
   - Elasticsearch for advanced search
   - Message queue (RabbitMQ/Kafka)
   - Separate databases per service
   - Kubernetes deployment
   - Comprehensive E2E tests
   - Performance monitoring
   - A/B testing framework

---

## Learning Outcomes

By building this project, you'll gain expertise in:

✅ **Architecture:** Microservices, event-driven design, monorepo structure
✅ **Backend:** Node.js, Express, TypeScript, RESTful APIs, WebSockets
✅ **Database:** PostgreSQL, Prisma ORM, schema design, relationships, migrations
✅ **Caching:** Redis, pub/sub patterns, session management
✅ **Frontend:** React, Redux Toolkit, real-time UI updates, state management
✅ **Authentication:** JWT, RBAC, security best practices
✅ **Testing:** Unit tests, integration tests, TDD approach
✅ **DevOps:** Docker, Docker Compose, environment management, deployment
✅ **Best Practices:** Clean code, SOLID principles, error handling, logging
✅ **Real-time:** Socket.io, WebSocket connections, presence tracking
✅ **Collaboration:** Git workflow, code review process

This project demonstrates senior-level full-stack capabilities and will be an excellent portfolio piece!