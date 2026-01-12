# Auth Service Test Suite

Comprehensive test suite for the authentication and authorization service using Vitest.

## Test Structure

```
__tests__/
├── setup.ts                    # Global test setup and teardown
├── utils/
│   └── testHelpers.ts         # Test utility functions
├── unit/
│   ├── auth.service.test.ts   # Auth service unit tests
│   ├── role.service.test.ts   # Role service unit tests
│   ├── permission.service.test.ts # Permission service unit tests
│   └── middleware.test.ts     # Middleware unit tests
└── integration/
    ├── auth.routes.test.ts    # Auth endpoints integration tests
    └── role.routes.test.ts    # Role endpoints integration tests
```

## Test Coverage

### Unit Tests

#### AuthService (auth.service.test.ts)
- ✅ User registration with validation
- ✅ Password hashing
- ✅ Duplicate email handling
- ✅ Token storage in Redis
- ✅ Login with valid/invalid credentials
- ✅ Account status checks
- ✅ Token refresh
- ✅ Logout and token cleanup
- ✅ User profile retrieval and updates
- ✅ Password changes with security checks
- ✅ Password reset flow (forgot/reset)
- ✅ Token expiration and validation

#### RoleService (role.service.test.ts)
- ✅ Get all roles with permissions
- ✅ Get role by ID/name
- ✅ Create/update/delete roles
- ✅ Role assignment to users
- ✅ Role revocation from users
- ✅ Get users by role
- ✅ Get roles for user
- ✅ Cascade delete prevention

#### PermissionService (permission.service.test.ts)
- ✅ Get all permissions
- ✅ Get permission by ID
- ✅ Get permissions by resource
- ✅ Assign/revoke permissions to/from roles
- ✅ Bulk permission operations
- ✅ Get permissions for role
- ✅ Get roles for permission

#### Middleware (middleware.test.ts)
- ✅ Token authentication
- ✅ Permission-based access control
- ✅ Role-based access control
- ✅ Resource and action validation

### Integration Tests

#### Auth Routes (auth.routes.test.ts)
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ POST /api/auth/refresh
- ✅ POST /api/auth/logout
- ✅ GET /api/auth/me
- ✅ PATCH /api/auth/me
- ✅ PATCH /api/auth/me/password
- ✅ POST /api/auth/forgot-password
- ✅ POST /api/auth/reset-password

#### Role Routes (role.routes.test.ts)
- ✅ GET /api/roles
- ✅ POST /api/roles
- ✅ POST /api/roles/assign
- ✅ Permission checks for each endpoint
- ✅ Authentication requirements

## Setup

### Prerequisites

1. **Test Database**: Create a separate test database
   ```bash
   createdb auth_db_test
   ```

2. **Environment Variables**: Copy `.env.test` with test configurations
   ```bash
   cp .env .env.test
   ```

3. **Run Migrations**: Apply database schema to test database
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_db_test" npm run migrate:dev
   ```

4. **Redis**: Ensure Redis is running for test token storage
   ```bash
   redis-server
   ```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npm test -- auth.service.test.ts
```

### Run tests matching pattern
```bash
npm test -- --grep "login"
```

## Test Utilities

### createTestUser(data?)
Creates a test user with optional custom data.

### createTestRole(data?)
Creates a test role with optional custom data.

### createTestPermission(data?)
Creates a test permission with optional custom data.

### assignRoleToUser(userId, roleId)
Assigns a role to a user.

### assignPermissionToRole(roleId, permissionId)
Assigns a permission to a role.

### generateTokensForUser(userId, email)
Generates access and refresh tokens for testing.

### createUserWithRole(roleName, email?)
Creates a user and assigns them a role in one step.

### createRoleWithPermissions(roleName, permissionNames)
Creates a role with multiple permissions in one step.

### createCompleteTestSetup()
Creates a complete test setup with users, roles, and permissions.

## Coverage Goals

- **Overall**: >80%
- **Services**: >90%
- **Controllers**: >80%
- **Middleware**: >90%

## Best Practices

1. **Isolation**: Each test is independent and cleans up after itself
2. **Fast**: Tests run quickly using in-memory Redis and efficient DB operations
3. **Realistic**: Integration tests use real HTTP requests via supertest
4. **Comprehensive**: Cover happy paths, error cases, and edge cases
5. **Maintainable**: Use helper functions to reduce duplication

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env.test
- Verify test database exists

### Redis Connection Issues
- Ensure Redis is running on localhost:6379
- Check Redis connection in setup.ts

### Test Timeouts
- Increase timeout in vitest.config.ts if needed
- Check for hanging async operations
- Ensure proper cleanup in afterEach hooks

## Adding New Tests

1. Create test file in appropriate directory (unit/ or integration/)
2. Import necessary test helpers
3. Follow existing test patterns
4. Use descriptive test names
5. Test both success and failure cases
6. Clean up test data in afterEach hook

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/auth_db_test
    REDIS_HOST: localhost
    REDIS_PORT: 6379
```
