# Tech Stack Guide & Learning Resources

This guide provides links to official documentation and learning resources for all technologies used in this project.

---

## Frontend Technologies

### React 18
**What it is:** A JavaScript library for building user interfaces

**Official Docs:** https://react.dev/
**Learn:**
- [React Tutorial](https://react.dev/learn)
- [React Hooks](https://react.dev/reference/react)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

**Key Concepts for This Project:**
- Functional components
- Hooks (useState, useEffect, useCallback, useMemo)
- Custom hooks
- Context API
- Component composition

---

### TypeScript
**What it is:** Typed superset of JavaScript

**Official Docs:** https://www.typescriptlang.org/
**Learn:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

**Key Concepts for This Project:**
- Interfaces and Types
- Generics
- Union and Intersection types
- Utility types (Partial, Pick, Omit)
- Type guards
- Strict mode configuration

**Config Example:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

### Redux Toolkit
**What it is:** State management library for React

**Official Docs:** https://redux-toolkit.js.org/
**Learn:**
- [Redux Essentials Tutorial](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
- [Redux Toolkit Quick Start](https://redux-toolkit.js.org/tutorials/quick-start)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)

**Key Concepts for This Project:**
- createSlice
- createAsyncThunk
- configureStore
- Redux DevTools
- Immer (built-in immutability)

**Example Slice:**
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  loading: false
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) state.tasks[index] = action.payload;
    }
  }
});
```

---

### Socket.io Client
**What it is:** Real-time WebSocket client library

**Official Docs:** https://socket.io/docs/v4/client-api/
**Learn:**
- [Client Installation](https://socket.io/docs/v4/client-installation/)
- [Emit and Listen](https://socket.io/docs/v4/emitting-events/)

**Key Concepts for This Project:**
- Connection management
- Event emitters and listeners
- Rooms
- Reconnection logic
- Authentication

**Example Usage:**
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3004', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.emit('join:project', { projectId: '123' });

socket.on('task:updated', (task) => {
  console.log('Task updated:', task);
});
```

---

### Vite
**What it is:** Fast build tool and dev server

**Official Docs:** https://vitejs.dev/
**Learn:**
- [Getting Started](https://vitejs.dev/guide/)
- [Features](https://vitejs.dev/guide/features.html)

**Key Features:**
- Lightning-fast HMR (Hot Module Replacement)
- Optimized builds
- Native ES modules
- Plugin ecosystem

---

### Vitest
**What it is:** Blazing fast unit test framework

**Official Docs:** https://vitest.dev/
**Learn:**
- [Getting Started](https://vitest.dev/guide/)
- [API Reference](https://vitest.dev/api/)

**Key Concepts for This Project:**
- describe, it, expect
- beforeEach, afterEach
- Mock functions
- Coverage reports

**Example Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from './utils';

describe('formatDate', () => {
  it('formats ISO date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });
});
```

---

## Backend Technologies

### Node.js
**What it is:** JavaScript runtime built on Chrome's V8 engine

**Official Docs:** https://nodejs.org/docs/
**Learn:**
- [Node.js Guide](https://nodejs.org/en/docs/guides/)
- [Best Practices](https://github.com/goldbergyoni/nodebestpractices)

**Key Concepts for This Project:**
- Event loop
- Async/await
- CommonJS vs ES Modules
- Environment variables
- Process management

---

### Express
**What it is:** Fast, unopinionated web framework for Node.js

**Official Docs:** https://expressjs.com/
**Learn:**
- [Getting Started](https://expressjs.com/en/starter/installing.html)
- [Routing](https://expressjs.com/en/guide/routing.html)
- [Middleware](https://expressjs.com/en/guide/using-middleware.html)

**Key Concepts for This Project:**
- Routing
- Middleware
- Error handling
- Request/Response objects

**Example Server:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

### Prisma ORM
**What it is:** Next-generation TypeScript ORM

**Official Docs:** https://www.prisma.io/docs
**Learn:**
- [Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [CRUD Operations](https://www.prisma.io/docs/concepts/components/prisma-client/crud)

**Key Concepts for This Project:**
- Schema definition
- Migrations
- Prisma Client
- Relations
- Transactions

**Schema Example:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tasks     Task[]

  @@map("users")
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      String
  priority    String
  assigneeId  String?  @map("assignee_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  assignee    User?    @relation(fields: [assigneeId], references: [id])

  @@map("tasks")
}
```

**Usage Example:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashedpassword',
    firstName: 'John',
    lastName: 'Doe'
  }
});

// Read
const tasks = await prisma.task.findMany({
  where: { assigneeId: user.id },
  include: { assignee: true }
});

// Update
await prisma.task.update({
  where: { id: '123' },
  data: { status: 'DONE' }
});

// Delete
await prisma.task.delete({
  where: { id: '123' }
});
```

---

### PostgreSQL
**What it is:** Powerful open-source relational database

**Official Docs:** https://www.postgresql.org/docs/
**Learn:**
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [SQL Syntax](https://www.postgresql.org/docs/current/sql-syntax.html)

**Key Concepts for This Project:**
- Tables and relationships
- Indexes
- Transactions
- Constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE)
- Data types

---

### Redis
**What it is:** In-memory data structure store

**Official Docs:** https://redis.io/docs/
**Learn:**
- [Redis Tutorial](https://redis.io/docs/getting-started/)
- [Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [Data Types](https://redis.io/docs/data-types/)

**Key Concepts for This Project:**
- Key-value storage
- Pub/Sub messaging
- Session storage
- Caching
- Expiration (TTL)

**Example Usage:**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

// Set/Get
await redis.set('key', 'value', 'EX', 3600); // Expires in 1 hour
const value = await redis.get('key');

// Pub/Sub
const publisher = new Redis();
const subscriber = new Redis();

subscriber.subscribe('task-updates');
subscriber.on('message', (channel, message) => {
  console.log(`Received: ${message} from ${channel}`);
});

publisher.publish('task-updates', JSON.stringify({ taskId: '123', status: 'DONE' }));
```

---

### Socket.io Server
**What it is:** Real-time WebSocket server library

**Official Docs:** https://socket.io/docs/v4/server-api/
**Learn:**
- [Server Installation](https://socket.io/docs/v4/server-installation/)
- [Emitting Events](https://socket.io/docs/v4/emitting-events/)
- [Rooms](https://socket.io/docs/v4/rooms/)

**Example Server:**
```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join:project', ({ projectId }) => {
    socket.join(`project:${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(3004);
```

---

### JWT (JSON Web Tokens)
**What it is:** Compact, URL-safe means of representing claims

**Official Docs:** https://jwt.io/introduction
**Learn:**
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)

**Example Usage:**
```typescript
import jwt from 'jsonwebtoken';

// Sign token
const token = jwt.sign(
  { userId: '123', email: 'user@example.com' },
  process.env.JWT_SECRET!,
  { expiresIn: '15m' }
);

// Verify token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  console.log(decoded);
} catch (err) {
  console.error('Invalid token');
}
```

---

## Infrastructure & DevOps

### Docker
**What it is:** Platform for containerizing applications

**Official Docs:** https://docs.docker.com/
**Learn:**
- [Get Started](https://docs.docker.com/get-started/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)

**Dockerfile Example:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

---

### Docker Compose
**What it is:** Tool for defining multi-container Docker applications

**Official Docs:** https://docs.docker.com/compose/
**Learn:**
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)

**docker-compose.yml Example:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pmdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  auth-service:
    build: ./apps/auth-service
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/pmdb
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

---

### Nginx
**What it is:** High-performance web server and reverse proxy

**Official Docs:** https://nginx.org/en/docs/
**Learn:**
- [Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

**nginx.conf Example:**
```nginx
upstream auth_service {
    server auth-service:3001;
}

upstream project_service {
    server project-service:3002;
}

upstream task_service {
    server task-service:3003;
}

upstream realtime_service {
    server realtime-service:3004;
}

server {
    listen 80;

    location /api/auth {
        proxy_pass http://auth_service;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/projects {
        proxy_pass http://project_service;
    }

    location /api/tasks {
        proxy_pass http://task_service;
    }

    location /socket.io {
        proxy_pass http://realtime_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Additional Tools & Libraries

### bcrypt
**What it is:** Library for hashing passwords

**npm:** https://www.npmjs.com/package/bcrypt

**Usage:**
```typescript
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash('myPassword', 12);

// Verify password
const isValid = await bcrypt.compare('myPassword', hash);
```

---

### Zod
**What it is:** TypeScript-first schema validation

**Official Docs:** https://zod.dev/

**Usage:**
```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2)
});

// Validate
const result = userSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error });
}
```

---

### Helmet
**What it is:** Security middleware for Express

**npm:** https://www.npmjs.com/package/helmet

**Usage:**
```typescript
import helmet from 'helmet';

app.use(helmet());
```

---

### CORS
**What it is:** Cross-Origin Resource Sharing middleware

**npm:** https://www.npmjs.com/package/cors

**Usage:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## Learning Path Recommendations

### For Beginners
1. Start with **JavaScript** fundamentals
2. Learn **TypeScript** basics
3. Understand **React** and hooks
4. Learn **Node.js** and **Express**
5. Understand databases with **PostgreSQL**
6. Learn **Prisma** ORM
7. Understand **Docker** basics

### For Intermediate Developers
1. Master **TypeScript** advanced features
2. Learn **Redux Toolkit** for state management
3. Understand **microservices** architecture
4. Learn **WebSockets** with **Socket.io**
5. Master **Redis** for caching and pub/sub
6. Understand **Docker Compose** for orchestration
7. Learn **CI/CD** with **GitHub Actions**

### For Advanced Developers
1. Master system design and architecture
2. Learn advanced **PostgreSQL** (indexes, query optimization)
3. Understand event-driven architecture
4. Master **Kubernetes** for orchestration
5. Learn monitoring and logging strategies
6. Understand security best practices
7. Master performance optimization

---

## Recommended VS Code Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Prisma** - Prisma schema support
- **Docker** - Docker file support
- **GitLens** - Enhanced Git integration
- **Thunder Client** - API testing
- **Error Lens** - Inline error highlighting
- **Auto Rename Tag** - Rename matching HTML/JSX tags
- **Path Intellisense** - Path autocomplete

---

## Useful Resources

### Blogs & Tutorials
- [freeCodeCamp](https://www.freecodecamp.org/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Dev.to](https://dev.to/)
- [LogRocket Blog](https://blog.logrocket.com/)

### YouTube Channels
- [Traversy Media](https://www.youtube.com/user/TechGuyWeb)
- [Web Dev Simplified](https://www.youtube.com/c/WebDevSimplified)
- [Fireship](https://www.youtube.com/c/Fireship)
- [The Net Ninja](https://www.youtube.com/c/TheNetNinja)

### Books
- "You Don't Know JS" by Kyle Simpson
- "Clean Code" by Robert C. Martin
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Node.js Design Patterns" by Mario Casciaro

---

## Next Steps

1. Review this guide and bookmark documentation links
2. Set up your development environment
3. Start with Phase 0 in IMPLEMENTATION_PLAN.md
4. Learn as you build - reference docs when needed
5. Join relevant communities (Discord, Reddit, Stack Overflow)

Happy coding! 🚀
