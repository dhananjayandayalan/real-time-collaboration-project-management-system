# Real-Time Collaboration Project Management System

A full-stack real-time collaboration project management system similar to Jira, built with modern technologies and best practices. This project demonstrates advanced full-stack development skills including microservices architecture, real-time communication, and comprehensive testing.

## Features

- **Real-time Collaboration:** Live updates using WebSocket connections
- **Project Management:** Create and manage projects, tasks, and issues
- **Role-Based Access Control:** Admin, Manager, Developer, and Viewer roles with granular permissions
- **Task Management:** Full CRUD operations for tasks with status tracking, priorities, assignments, and comments
- **User Presence:** See who's online and what they're working on
- **Typing Indicators:** Real-time typing indicators in comments
- **Activity Tracking:** Complete history of all changes to tasks
- **Responsive Design:** Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management
- **Socket.io Client** - Real-time communication
- **CSS Modules** - Scoped styling
- **Vitest** - Testing framework
- **Vite** - Fast build tool

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Relational database
- **Redis** - Caching and pub/sub
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Vitest** - Testing framework

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - API Gateway and reverse proxy
- **GitHub Actions** - CI/CD pipeline

## Architecture

This project uses a **monorepo with microservices architecture**:

- **Auth Service** - User authentication and authorization
- **Project Service** - Workspace and project management
- **Task Service** - Task/issue management with comments and attachments
- **Real-time Service** - WebSocket server for live updates

All services communicate via:
- **REST APIs** for synchronous operations
- **Redis Pub/Sub** for asynchronous event-driven communication

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Project Structure

```
├── apps/
│   ├── client/              # React frontend
│   ├── auth-service/        # Authentication microservice
│   ├── project-service/     # Project management microservice
│   ├── task-service/        # Task management microservice
│   └── realtime-service/    # WebSocket microservice
├── packages/
│   └── shared/              # Shared types and utilities
├── docker/
│   ├── nginx/               # Nginx configuration
│   ├── postgres/            # PostgreSQL initialization
│   └── redis/               # Redis configuration
├── docker-compose.yml       # Development environment
├── ARCHITECTURE.md          # Detailed architecture documentation
└── IMPLEMENTATION_PLAN.md   # Phase-by-phase implementation guide
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** and **Docker Compose**
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd real-time-collaboration-project-management-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy example env files
   cp apps/auth-service/.env.example apps/auth-service/.env
   cp apps/project-service/.env.example apps/project-service/.env
   cp apps/task-service/.env.example apps/task-service/.env
   cp apps/realtime-service/.env.example apps/realtime-service/.env
   cp apps/client/.env.example apps/client/.env
   ```

4. **Start infrastructure (PostgreSQL, Redis, Nginx):**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate:dev
   ```

6. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

7. **Start all services:**
   ```bash
   npm run dev
   ```

The application will be available at:
- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:80
- **Auth Service:** http://localhost:3001
- **Project Service:** http://localhost:3002
- **Task Service:** http://localhost:3003
- **Real-time Service:** http://localhost:3004

## Development

### Available Scripts

```bash
# Run all services in development mode
npm run dev

# Run individual services
npm run dev:auth
npm run dev:project
npm run dev:task
npm run dev:realtime
npm run dev:client

# Build all services
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Database migrations
npm run migrate:dev
npm run migrate:deploy
npm run migrate:reset

# Seed database
npm run seed
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests for specific service
npm run test --workspace=apps/auth-service

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Implementation Plan

This project is divided into 10 phases, each building on the previous one:

1. **Phase 0:** Project Setup & Infrastructure
2. **Phase 1:** Authentication Service
3. **Phase 2:** Project Service
4. **Phase 3:** Task Service
5. **Phase 4:** Real-time Service
6. **Phase 5:** Frontend Foundation
7. **Phase 6:** Project & Task UI
8. **Phase 7:** Real-time Integration
9. **Phase 8:** Polish & Optimization
10. **Phase 9:** Testing & Quality Assurance
11. **Phase 10:** Deployment

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed task breakdown and timeline.

## API Documentation

### Authentication Endpoints

```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/logout         - Logout user
POST   /api/auth/refresh        - Refresh access token
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password - Reset password
GET    /api/auth/me             - Get current user
PATCH  /api/auth/me             - Update current user
```

### Project Endpoints

```
POST   /api/workspaces          - Create workspace
GET    /api/workspaces          - List workspaces
GET    /api/workspaces/:id      - Get workspace
PATCH  /api/workspaces/:id      - Update workspace
DELETE /api/workspaces/:id      - Delete workspace

POST   /api/projects            - Create project
GET    /api/projects            - List projects
GET    /api/projects/:id        - Get project
PATCH  /api/projects/:id        - Update project
DELETE /api/projects/:id        - Delete project
POST   /api/projects/:id/members - Add project member
DELETE /api/projects/:id/members/:userId - Remove member
```

### Task Endpoints

```
POST   /api/tasks               - Create task
GET    /api/tasks               - List tasks (with filters)
GET    /api/tasks/:id           - Get task
PATCH  /api/tasks/:id           - Update task
DELETE /api/tasks/:id           - Delete task

POST   /api/tasks/:id/comments  - Add comment
GET    /api/tasks/:id/comments  - List comments
PATCH  /api/tasks/:id/comments/:commentId - Update comment
DELETE /api/tasks/:id/comments/:commentId - Delete comment

POST   /api/tasks/:id/attachments - Upload attachment
DELETE /api/tasks/:id/attachments/:attachmentId - Delete attachment

POST   /api/tasks/:id/watchers  - Add watcher
DELETE /api/tasks/:id/watchers/:userId - Remove watcher

GET    /api/tasks/:id/history   - Get task history
```

## WebSocket Events

### Client → Server

```javascript
socket.emit('join:project', { projectId: '123' })
socket.emit('leave:project', { projectId: '123' })
socket.emit('join:task', { taskId: '456' })
socket.emit('typing:start', { taskId: '456' })
socket.emit('typing:stop', { taskId: '456' })
```

### Server → Client

```javascript
socket.on('task:created', (task) => { /* ... */ })
socket.on('task:updated', (task) => { /* ... */ })
socket.on('task:deleted', (taskId) => { /* ... */ })
socket.on('comment:added', (comment) => { /* ... */ })
socket.on('user:online', (userId) => { /* ... */ })
socket.on('user:offline', (userId) => { /* ... */ })
socket.on('typing:user', ({ userId, taskId }) => { /* ... */ })
```

## Deployment

### Production Build

```bash
# Build all services
npm run build

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Node Environment
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3001
PROJECT_SERVICE_URL=http://project-service:3002
TASK_SERVICE_URL=http://task-service:3003
REALTIME_SERVICE_URL=http://realtime-service:3004
```

See deployment documentation for detailed instructions.

## Testing

This project follows Test-Driven Development (TDD) principles:

- **Unit Tests:** Test individual functions and components
- **Integration Tests:** Test API endpoints and service interactions
- **E2E Tests (Future):** Test complete user flows

Target coverage:
- Backend: >80%
- Frontend: >70%

## Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Best Practices Demonstrated

This project demonstrates senior-level development practices:

- **Clean Architecture:** Separation of concerns, dependency injection
- **SOLID Principles:** Single responsibility, open/closed, etc.
- **Type Safety:** Strict TypeScript configuration
- **Error Handling:** Centralized error handling and logging
- **Security:** JWT authentication, RBAC, input validation, rate limiting
- **Testing:** Comprehensive test coverage with TDD approach
- **Code Quality:** ESLint, Prettier, consistent naming conventions
- **Documentation:** Clear README, architecture docs, API documentation
- **Git Workflow:** Conventional commits, feature branches, code review
- **DevOps:** Docker containerization, CI/CD pipeline, environment management

## Learning Outcomes

By building this project, you'll gain expertise in:

- Microservices architecture and inter-service communication
- Real-time web applications with WebSockets
- Advanced state management with Redux Toolkit
- Database design and ORM usage (Prisma)
- Authentication and authorization (JWT, RBAC)
- Caching strategies with Redis
- Docker and containerization
- Testing strategies (unit, integration)
- TypeScript best practices
- Full-stack application deployment

## License

This project is licensed under the MIT License.

## Author

**Your Name**
- Portfolio: [your-portfolio.com](https://your-portfolio.com)
- LinkedIn: [your-linkedin](https://linkedin.com/in/your-profile)
- GitHub: [@your-username](https://github.com/your-username)

---

Built with ❤️ as a portfolio project to demonstrate full-stack development expertise.
