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