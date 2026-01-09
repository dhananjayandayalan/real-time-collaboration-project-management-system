# Getting Started - Quick Start Checklist

This checklist will guide you through setting up and starting development on this project.

---

## Prerequisites Checklist

Before you begin, ensure you have the following installed:

- [ ] **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
  ```bash
  node --version  # Should be v18.x or higher
  ```

- [ ] **npm** (v9 or higher) - Comes with Node.js
  ```bash
  npm --version  # Should be v9.x or higher
  ```

- [ ] **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] **Git** - [Download](https://git-scm.com/)
  ```bash
  git --version
  ```

- [ ] **Code Editor** - Recommended: [VS Code](https://code.visualstudio.com/)

---

## Phase 0: Initial Setup (Start Here!)

### Step 1: Install Dependencies

- [ ] Install root dependencies
  ```bash
  npm install
  ```

This will install:
- `concurrently` - Run multiple npm scripts simultaneously
- `prettier` - Code formatting
- `typescript` - TypeScript compiler

---

### Step 2: Set Up Monorepo Structure

Create the following folder structure:

- [ ] Create `apps` directory
  ```bash
  mkdir apps
  ```

- [ ] Create `packages` directory
  ```bash
  mkdir packages
  ```

- [ ] Create `docker` directory
  ```bash
  mkdir docker
  ```

Your structure should look like:
```
real-time-collaboration-project-management-system/
├── apps/
├── packages/
├── docker/
├── .gitignore
├── package.json
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── TECH_STACK_GUIDE.md
└── GETTING_STARTED.md (this file)
```

---

### Step 3: Create Shared Package

The shared package will contain common types, constants, and utilities used across all services.

- [ ] Create shared package directory
  ```bash
  mkdir -p packages/shared/src
  ```

- [ ] Create `packages/shared/package.json`:
  ```json
  {
    "name": "@pm-system/shared",
    "version": "1.0.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsc",
      "dev": "tsc --watch"
    },
    "devDependencies": {
      "typescript": "^5.3.3"
    }
  }
  ```

- [ ] Create `packages/shared/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "declaration": true,
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] Create `packages/shared/src/index.ts`:
  ```typescript
  export * from './types';
  export * from './constants';
  export * from './utils';
  ```

- [ ] Create `packages/shared/src/types/index.ts`:
  ```typescript
  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }

  export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    IN_REVIEW = 'IN_REVIEW',
    DONE = 'DONE',
    BLOCKED = 'BLOCKED'
  }

  export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
  }

  export enum TaskType {
    STORY = 'STORY',
    TASK = 'TASK',
    BUG = 'BUG',
    EPIC = 'EPIC'
  }

  export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    DEVELOPER = 'DEVELOPER',
    VIEWER = 'VIEWER'
  }
  ```

- [ ] Create `packages/shared/src/constants/index.ts`:
  ```typescript
  export const JWT_EXPIRY = '15m';
  export const REFRESH_TOKEN_EXPIRY = '7d';
  export const BCRYPT_ROUNDS = 12;
  ```

- [ ] Create `packages/shared/src/utils/index.ts`:
  ```typescript
  export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  export const generateProjectKey = (projectName: string): string => {
    return projectName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4);
  };
  ```

---

### Step 4: Set Up Docker Infrastructure

- [ ] Create Docker Compose file at root: `docker-compose.yml`
  ```yaml
  version: '3.8'

  services:
    postgres:
      image: postgres:15-alpine
      container_name: pm-postgres
      environment:
        POSTGRES_USER: admin
        POSTGRES_PASSWORD: password
        POSTGRES_DB: pmdb
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
      networks:
        - pm-network

    redis:
      image: redis:7-alpine
      container_name: pm-redis
      ports:
        - "6379:6379"
      networks:
        - pm-network

    nginx:
      image: nginx:alpine
      container_name: pm-nginx
      ports:
        - "80:80"
      volumes:
        - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      depends_on:
        - auth-service
        - project-service
        - task-service
        - realtime-service
      networks:
        - pm-network

  volumes:
    postgres_data:

  networks:
    pm-network:
      driver: bridge
  ```

- [ ] Create Nginx configuration directory
  ```bash
  mkdir -p docker/nginx
  ```

- [ ] Create `docker/nginx/nginx.conf`:
  ```nginx
  events {
      worker_connections 1024;
  }

  http {
      upstream auth_service {
          server host.docker.internal:3001;
      }

      upstream project_service {
          server host.docker.internal:3002;
      }

      upstream task_service {
          server host.docker.internal:3003;
      }

      upstream realtime_service {
          server host.docker.internal:3004;
      }

      server {
          listen 80;

          location /api/auth {
              proxy_pass http://auth_service;
              proxy_http_version 1.1;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          }

          location /api/workspaces {
              proxy_pass http://project_service;
              proxy_http_version 1.1;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
          }

          location /api/projects {
              proxy_pass http://project_service;
              proxy_http_version 1.1;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
          }

          location /api/tasks {
              proxy_pass http://task_service;
              proxy_http_version 1.1;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
          }

          location /socket.io {
              proxy_pass http://realtime_service;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection "upgrade";
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
          }
      }
  }
  ```

- [ ] Start Docker services
  ```bash
  npm run docker:up
  ```

- [ ] Verify services are running
  ```bash
  docker ps
  ```

You should see containers for `pm-postgres`, `pm-redis`, and `pm-nginx`.

---

### Step 5: Initialize Git Repository

- [ ] Initialize git (if not already done)
  ```bash
  git init
  ```

- [ ] Create initial commit
  ```bash
  git add .
  git commit -m "feat: initial project setup with monorepo structure"
  ```

- [ ] Create GitHub repository and push (optional)
  ```bash
  git remote add origin <your-repo-url>
  git branch -M main
  git push -u origin main
  ```

---

### Step 6: Set Up Prettier Configuration

- [ ] Create `.prettierrc` at root:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "arrowParens": "always"
  }
  ```

- [ ] Create `.prettierignore`:
  ```
  node_modules
  dist
  build
  coverage
  .next
  ```

---

## Phase 1: Authentication Service Setup

Now that the infrastructure is ready, you can start building the first microservice!

### Next Steps:

- [ ] Read Phase 1 tasks in `IMPLEMENTATION_PLAN.md`
- [ ] Create `apps/auth-service` directory
- [ ] Initialize the service with npm
- [ ] Set up Express server
- [ ] Configure Prisma
- [ ] Implement authentication endpoints

**Detailed instructions for Phase 1 are in `IMPLEMENTATION_PLAN.md` - follow the tasks there!**

---

## Useful Commands Reference

### Docker Commands
```bash
# Start all infrastructure services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Clean up everything (including volumes)
npm run docker:clean

# Access PostgreSQL shell
docker exec -it pm-postgres psql -U admin -d pmdb

# Access Redis CLI
docker exec -it pm-redis redis-cli
```

### Development Commands
```bash
# Run all services
npm run dev

# Run individual service
npm run dev:auth
npm run dev:project
npm run dev:task
npm run dev:realtime
npm run dev:client

# Build all services
npm run build

# Run tests
npm run test

# Format code
npm run format
```

### Database Commands (once Prisma is set up)
```bash
# Create migration
npm run migrate:dev --workspace=apps/auth-service

# Apply migrations to production
npm run migrate:deploy

# Reset database
npm run migrate:reset

# Seed database
npm run seed
```

---

## Troubleshooting

### Docker Issues

**Problem:** Docker containers won't start
```bash
# Check Docker is running
docker info

# Check for port conflicts
netstat -ano | findstr :5432
netstat -ano | findstr :6379
netstat -ano | findstr :80

# Restart Docker Desktop
```

**Problem:** Can't connect to PostgreSQL
```bash
# Check container is running
docker ps | grep postgres

# Check logs
docker logs pm-postgres

# Verify connection
docker exec -it pm-postgres psql -U admin -d pmdb -c "SELECT 1;"
```

### npm Issues

**Problem:** `npm install` fails
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Workspace not found
```bash
# Make sure you're in the root directory
pwd

# Verify workspace exists in package.json
cat package.json | grep workspaces
```

---

## Development Workflow

### Daily Workflow

1. **Start Docker services** (if not running)
   ```bash
   npm run docker:up
   ```

2. **Start development servers**
   ```bash
   npm run dev
   ```

3. **Make changes to code**

4. **Run tests**
   ```bash
   npm run test
   ```

5. **Format code**
   ```bash
   npm run format
   ```

6. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: your commit message"
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `test:` Adding tests
- `docs:` Documentation changes
- `chore:` Maintenance tasks

Examples:
```bash
git commit -m "feat: add user registration endpoint"
git commit -m "fix: resolve JWT expiration issue"
git commit -m "refactor: improve error handling in auth service"
git commit -m "test: add unit tests for task service"
```

---

## Learning Resources

As you work through the implementation, refer to:

1. **ARCHITECTURE.md** - System architecture and design decisions
2. **IMPLEMENTATION_PLAN.md** - Detailed phase-by-phase tasks
3. **TECH_STACK_GUIDE.md** - Documentation links and code examples
4. **README.md** - Project overview and API documentation

---

## Getting Help

If you get stuck:

1. Check the official documentation (links in TECH_STACK_GUIDE.md)
2. Search Stack Overflow
3. Check GitHub issues for the specific library
4. Review the implementation plan for context
5. Read through code examples in TECH_STACK_GUIDE.md

---

## Current Status

- [x] Project structure created
- [x] Documentation written
- [x] Docker infrastructure configured
- [ ] Auth service implementation
- [ ] Project service implementation
- [ ] Task service implementation
- [ ] Real-time service implementation
- [ ] Frontend implementation
- [ ] Testing
- [ ] Deployment

---

## Next Steps

✅ **You've completed Phase 0 setup!**

Now proceed to **Phase 1: Authentication Service** in the `IMPLEMENTATION_PLAN.md` file.

Good luck with your project! 🚀
