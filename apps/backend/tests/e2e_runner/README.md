# E2E Test Runner

End-to-end test runner for complete system testing. Tests the entire application flow from start to finish.

## Overview

This test runner executes E2E tests that verify complete system behavior, including:
- Full user workflows
- System integration scenarios
- Cross-module interactions
- Data persistence and consistency
- Complete API flows with multiple endpoints

## Differences from Integration Tests

| Aspect | Integration Tests | E2E Tests |
|--------|------------------|-----------|
| **Scope** | API endpoints | Complete user workflows |
| **Pattern** | `*.http.spec.ts` | `*.spec.ts` |
| **Timeout** | 30 seconds | 60 seconds |
| **Focus** | Single endpoint | Multiple endpoints |
| **Example** | Test single POST /api/courses | Test complete course creation flow |

## Architecture

```
tests/e2e_runner/
├── Dockerfile              # Container definition for E2E tests
├── package.json            # Dependencies and scripts
├── jest.config.ts          # Jest configuration for E2E
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file

src/modules/*/tests/e2e/   # E2E test files location
└── *.spec.ts              # E2E test files
```

## Running Tests

### Local Development (Docker)

```bash
# Run E2E tests
docker compose -f docker-compose.local.test.yml up e2e-runner

# Run with rebuild
docker compose -f docker-compose.local.test.yml up e2e-runner --build

# Run in background
docker compose -f docker-compose.local.test.yml up -d e2e-runner

# View logs
docker compose -f docker-compose.local.test.yml logs -f e2e-runner
```

### Inside Container

```bash
# Run all E2E tests
npm run test:e2e

# Run with verbose output
npm run test:verbose

# Run in watch mode (for development)
npm run test:watch

# Run tests in parallel (2 workers)
npm run test:e2e:parallel
```

## Writing E2E Tests

### File Naming Convention

- **Location**: `src/modules/{module}/tests/e2e/`
- **Pattern**: `{feature}.spec.ts`
- **Example**: `course-enrollment.spec.ts`

### Example E2E Test

```typescript
import { ApiTestClient, setupTestClient, teardownTestClient } from '../../../../../tests/helpers/api-client';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';

describe('Course Enrollment E2E', () => {
  let client: ApiTestClient;

  beforeAll(async () => {
    client = await setupTestClient();
  });

  afterAll(async () => {
    await teardownTestClient(client);
  });

  afterEach(async () => {
    await client.resetSchema();
    client.clearAuthToken();
  });

  it('should complete full course enrollment flow', async () => {
    // 1. Register user
    const dto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
    const registerResponse = await client.post('/api/auth/register', dto);
    expect(registerResponse.status).toBe(201);

    const token = registerResponse.data.access_token;
    client.setAuthToken(token);

    // 2. Create course
    const courseData = {
      name: 'Test Course',
      price: 100,
      date_start: new Date().toISOString(),
      date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const courseResponse = await client.post('/api/courses', courseData);
    expect(courseResponse.status).toBe(201);
    const courseId = courseResponse.data.id;

    // 3. Enroll in course
    const enrollResponse = await client.post(`/api/courses/${courseId}/register`);
    expect(enrollResponse.status).toBe(201);

    // 4. Verify enrollment
    const enrollmentsResponse = await client.get(`/api/courses/${courseId}/enrollments`);
    expect(enrollmentsResponse.status).toBe(200);
    expect(enrollmentsResponse.data.length).toBe(1);

    // 5. Make payment
    const paymentResponse = await client.post(`/api/courses/${courseId}/pay`, {
      amount: courseData.price,
    });
    expect(paymentResponse.status).toBe(201);

    // 6. Verify payment
    const paymentsResponse = await client.get(`/api/courses/${courseId}/payments`);
    expect(paymentsResponse.status).toBe(200);
    expect(paymentsResponse.data.length).toBe(1);
  });
});
```

## Best Practices

### E2E Test Guidelines

1. **Test Complete Flows**: E2E tests should verify entire user workflows
2. **Use Real Data**: Don't mock external dependencies
3. **Test Happy and Unhappy Paths**: Include error scenarios
4. **Keep Tests Independent**: Each test should be self-contained
5. **Use Descriptive Names**: Test names should describe the workflow

### Test Organization

```typescript
describe('Feature E2E', () => {
  // Setup/teardown for all tests
  beforeAll(async () => { /* ... */ });
  afterAll(async () => { /* ... */ });
  afterEach(async () => { /* ... */ });

  describe('Happy Path', () => {
    it('should complete full workflow successfully', async () => {
      // Test main success scenario
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid data', async () => {
      // Test error handling
    });
  });
});
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `test` | Environment mode |
| `TEST_API_URL` | `http://backend:3000` | Backend API URL |
| `IS_OFFLINE` | `false` | Skip tests in offline mode |
| `JEST_TIMEOUT` | `60000` | Test timeout (ms) |

## Debugging

### Debug Mode

```bash
npm run test:debug
```

Then attach debugger to `localhost:9229`

### Verbose Logging

```bash
npm run test:verbose
```

## Allure Reports

Generate and view test reports:

```bash
# Clean old reports
npm run allure:clean

# Generate report from results
npm run allure:append

# Open report in browser
npm run allure:show
```

## Troubleshooting

### Tests Timing Out

Increase timeout in `jest.config.ts`:
```typescript
testTimeout: 120000, // 2 minutes
```

### Connection Refused

Ensure backend is running:
```bash
docker compose -f docker-compose.local.test.yml up backend
```

### Schema Conflicts

Tests should clean up after themselves. If issues persist:
```bash
docker compose -f docker-compose.local.test.yml down -v
```

## CI/CD Integration

E2E tests run automatically in CI pipeline after integration tests pass.

```yaml
test:e2e:
  stage: test
  script:
    - docker compose -f docker-compose.test.yml up --exit-code-from e2e-runner
```

## Performance

- **Test Duration**: E2E tests typically take 2-5 seconds each
- **Parallel Execution**: Use `test:e2e:parallel` for faster runs
- **Resource Usage**: E2E runner needs ~512MB RAM

## Contributing

When adding E2E tests:

1. Place test files in `src/modules/{module}/tests/e2e/`
2. Follow naming convention: `{feature}.spec.ts`
3. Test complete workflows, not individual endpoints
4. Include both success and error scenarios
5. Clean up test data in `afterEach`
6. Document complex test scenarios

## Related Documentation

- [Integration Tests](../integration_runner/README.md)
- [Test Helpers](../helpers/README.md)
- [API Client Documentation](../helpers/api-client.ts)
