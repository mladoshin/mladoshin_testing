# Testing Guide - Docker-based HTTP Testing

This document describes the new Docker-based testing approach with separate backend and test runner containers.

## Overview

The testing infrastructure has been redesigned to:
- Run tests via HTTP requests to an external backend
- Use Docker containers for isolated testing environments
- Implement schema isolation for parallel test execution
- Support both unit and integration/e2e tests

## Architecture

### Services

1. **postgres-test**: PostgreSQL database for tests
2. **backend-test**: NestJS backend running in test mode
3. **test-runner**: Container that runs integration/e2e tests via HTTP
4. **test-runner-unit**: Container that runs unit tests (no backend required)

### Test Types

#### Unit Tests
- Run with mocks (IS_OFFLINE=true)
- No HTTP requests, no database
- Fast execution
- Location: `src/modules/*/tests/unit/*.spec.ts`
- **No changes needed** - unit tests remain the same

#### Integration Tests
- Make HTTP requests to backend-test
- Use schema isolation via `X-Test-Schema` header
- Test API endpoints and service integration
- Location: `src/modules/*/tests/integration/*.spec.ts`
- **Require rewriting** to use ApiTestClient

#### E2E Tests
- Make HTTP requests to backend-test
- Test complete user flows
- Use schema isolation
- Location: `tests/e2e/*.e2e-spec.ts`
- **Require rewriting** to use ApiTestClient

## Schema Isolation Pattern

Each test gets its own isolated PostgreSQL schema:

1. Test creates a unique schema name (e.g., `test_schema_abc123`)
2. API endpoint `/api/test/create-schema` creates the schema and runs migrations
3. All HTTP requests include `X-Test-Schema: test_schema_abc123` header
4. Backend middleware routes queries to the correct schema
5. After test, `/api/test/drop-schema` cleans up

### Benefits
- Tests run in parallel without interfering
- No need for complex transaction rollback logic
- Clean isolation between test suites
- Fast cleanup

## Writing Integration/E2E Tests

### Basic Structure

\`\`\`typescript
import { ApiTestClient, setupTestClient, teardownTestClient } from '../../helpers/api-client';
import { createTestFactories, TestFactories } from '../../helpers/test-factories';

describe('Feature Tests', () => {
  let client: ApiTestClient;
  let factories: TestFactories;

  beforeAll(async () => {
    // Create HTTP client with isolated schema
    client = await setupTestClient();
    factories = createTestFactories(client);
  });

  afterAll(async () => {
    // Cleanup: drop the test schema
    await teardownTestClient(client);
  });

  beforeEach(async () => {
    // Create test data via API
    const user = await factories.users.create();
    const loginResult = await factories.users.login(user.email, 'password');
    client.setAuthToken(loginResult.accessToken);
  });

  afterEach(async () => {
    // Reset schema (truncate all tables)
    await client.resetSchema();
    client.clearAuthToken();
  });

  it('should do something', async () => {
    const response = await client.get('/api/endpoint');
    expect(response.status).toBe(200);
  });
});
\`\`\`

### API Test Client

The `ApiTestClient` provides:

\`\`\`typescript
// HTTP methods
await client.get(url, config)
await client.post(url, data, config)
await client.put(url, data, config)
await client.patch(url, data, config)
await client.delete(url, config)

// Schema management
await client.createSchema()    // Create isolated schema
await client.dropSchema()      // Drop schema
await client.resetSchema()     // Truncate all tables

// Authentication
client.setAuthToken(token)     // Set JWT token
client.clearAuthToken()        // Remove token

// Info
client.getSchemaName()         // Get schema name
client.getBaseURL()            // Get base URL
\`\`\`

### Test Factories

Helper factories for creating test data:

\`\`\`typescript
const factories = createTestFactories(client);

// Create user
const user = await factories.users.create({
  email: 'test@example.com',
  password: 'Test123456',
  firstName: 'Test',
  lastName: 'User',
});

// Login
const { accessToken } = await factories.users.login(email, password);

// Create course
const course = await factories.courses.create({
  name: 'Test Course',
  price: 100,
});
\`\`\`

## Running Tests

### Docker Commands

\`\`\`bash
# Run only backend (for manual testing or demonstration)
pnpm docker:test:backend-only

# Run unit tests only
pnpm docker:test:unit

# Run integration and e2e tests
docker-compose -f docker-compose.test.yml --profile test up test-runner

# Run all tests
pnpm docker:test
\`\`\`

### Local Development

Local testing is **not supported**. All tests must run via Docker to ensure consistency.

## Test API Endpoints

The following endpoints are available **only** in test environment (NODE_ENV=test):

### POST /api/test/create-schema
Creates an isolated schema and runs migrations.

**Headers:**
- `X-Test-Schema: schema_name`

**Response:**
\`\`\`json
{
  "message": "Schema created successfully",
  "schema": "test_schema_abc123"
}
\`\`\`

### POST /api/test/drop-schema
Drops an isolated schema.

**Headers:**
- `X-Test-Schema: schema_name`

### POST /api/test/reset-schema
Truncates all tables in a schema.

**Headers:**
- `X-Test-Schema: schema_name`

## Migrations

### Creating Migrations

\`\`\`bash
# Generate migration from entity changes
pnpm migration:generate src/database/migrations/MigrationName

# Create empty migration
pnpm migration:create src/database/migrations/MigrationName
\`\`\`

### Running Migrations

Migrations run automatically when backend-test starts:

\`\`\`bash
pnpm migration:run && pnpm seed:run && node dist/main
\`\`\`

### Reverting Migrations

\`\`\`bash
pnpm migration:revert
\`\`\`

## Seed Data

The seed script runs automatically after migrations. By default, it creates an empty database.

Tests should create their own data via API calls using factories.

## Migration Guide

### Converting Old Integration Tests

**Before:**
\`\`\`typescript
import { Test } from '@nestjs/testing';
import request from 'supertest';

let app: INestApplication;
let dataSource: DataSource;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    // ...
  }).compile();

  app = module.createNestApplication();
  await app.init();
  dataSource = module.get(DataSource);
});

it('test', async () => {
  await request(app.getHttpServer())
    .get('/api/endpoint')
    .expect(200);
});
\`\`\`

**After:**
\`\`\`typescript
import { ApiTestClient, setupTestClient } from '../../helpers/api-client';

let client: ApiTestClient;

beforeAll(async () => {
  client = await setupTestClient();
});

afterAll(async () => {
  await teardownTestClient(client);
});

it('test', async () => {
  const response = await client.get('/api/endpoint');
  expect(response.status).toBe(200);
});
\`\`\`

### Key Changes

1. ❌ Remove `Test.createTestingModule()`
2. ❌ Remove `app.getHttpServer()`
3. ❌ Remove direct database access (repositories)
4. ✅ Use `ApiTestClient` for HTTP requests
5. ✅ Create test data via API calls
6. ✅ Use factories for common objects
7. ✅ Schema cleanup handled automatically

## Troubleshooting

### Tests fail with "Cannot connect to backend"

Ensure backend-test is running and healthy:
\`\`\`bash
docker-compose -f docker-compose.test.yml ps
docker-compose -f docker-compose.test.yml logs backend-test
\`\`\`

### Migrations fail

Check that migrations are properly formatted:
\`\`\`bash
docker-compose -f docker-compose.test.yml logs backend-test | grep migration
\`\`\`

### Schema isolation not working

Verify X-Test-Schema header is being sent:
- Check test client configuration
- Verify middleware is applied in app.module.ts
- Ensure NODE_ENV=test in backend-test

### Tests interfere with each other

Ensure each test suite uses its own schema:
- Each test should call `setupTestClient()` in beforeAll
- Call `teardownTestClient()` in afterAll
- Use `resetSchema()` in beforeEach/afterEach if needed

## Environment Variables

### TEST_API_URL
Base URL for backend API (default: http://backend-test:3000)

### NODE_ENV
Must be "test" for schema isolation and test endpoints to work

### IS_OFFLINE
- `true`: Unit tests (no database)
- `false`: Integration tests (with database)

## Best Practices

1. **Always use factories** for creating test data
2. **Reset schema** between tests to ensure clean state
3. **Handle authentication** explicitly in tests that need it
4. **Use descriptive test names** that explain what's being tested
5. **Test both success and failure cases**
6. **Verify cleanup** - schemas should be dropped after tests
7. **Keep tests independent** - don't rely on execution order
8. **Use meaningful assertions** - check specific values, not just status codes

## Example Test Suite

See `src/modules/courses/tests/integration/courses.controller.http.spec.ts` for a complete example of the new testing approach.
