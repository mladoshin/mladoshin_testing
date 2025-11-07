# CI/CD Unit Tests Fix

## Problem

The GitHub Actions workflow was failing at the unit tests stage with:
```
dependency failed to start: container school_postgres_test is unhealthy
```

**Root Cause**: The `test-runner` service had a hard dependency on PostgreSQL with a health check condition. Unit tests don't need a database, but the service wouldn't start without it.

## Solution

Created a separate service for unit tests that doesn't depend on PostgreSQL.

### Changes Made

#### 1. `docker-compose.test.yml`

**Added new service `test-runner-unit`:**
- No database dependency
- Runs with `IS_OFFLINE=true`
- Automatically executes `pnpm run test:unit`
- Fast startup (no waiting for postgres)

**Kept existing `test-runner` service:**
- Has postgres dependency (for integration/e2e tests)
- Runs with full database access

```yaml
# Unit tests - no database
test-runner-unit:
  build: ...
  environment:
    IS_OFFLINE: "true"
  command: ["pnpm", "run", "test:unit"]
  # NO depends_on!

# Integration/E2E tests - with database
test-runner:
  build: ...
  depends_on:
    postgres-test:
      condition: service_healthy
```

#### 2. `.github/workflows/test.yml`

**Updated unit tests job:**
- Changed from `test-runner` to `test-runner-unit`
- Removed database startup
- Faster execution

```yaml
- name: Build test runner image
  run: docker compose build test-runner-unit

- name: Run unit tests
  run: docker compose run --rm test-runner-unit
```

#### 3. Documentation Updates

Updated `DOCKER.md` and `CI-CD.md` with:
- New commands for unit tests
- Clarified which services need database
- Updated examples and troubleshooting

## Usage

### Run unit tests (no database)
```bash
cd apps/backend
docker compose -f docker-compose.test.yml run --rm test-runner-unit
```

### Run integration tests (with database)
```bash
docker compose -f docker-compose.test.yml up -d postgres-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration
docker compose -f docker-compose.test.yml down
```

### Run E2E tests (full stack)
```bash
docker compose -f docker-compose.test.yml up -d postgres-test backend-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:e2e
docker compose -f docker-compose.test.yml down
```

## Benefits

1. **Faster unit tests**: No waiting for PostgreSQL to start
2. **Isolated testing**: Unit tests truly isolated from external dependencies
3. **Better CI/CD**: Pipeline fails fast if postgres issues occur
4. **Clearer intent**: Service names indicate their purpose

## Testing

To verify the fix works:

```bash
# This should work without starting postgres
docker compose -f docker-compose.test.yml run --rm test-runner-unit

# Verify no postgres container running
docker ps | grep postgres  # Should be empty
```

## Expected CI/CD Flow

```
Unit Tests (test-runner-unit)
  ├─ No postgres required
  ├─ Fast startup (~30s)
  └─ ✅ or ❌

Integration Tests (test-runner)
  ├─ Starts postgres
  ├─ Waits for health check
  ├─ Runs tests (~2-5 min)
  └─ ✅ or ❌

E2E Tests (test-runner)
  ├─ Starts postgres + backend
  ├─ Waits for both services
  ├─ Runs tests (~3-7 min)
  └─ ✅ or ❌
```

This fix ensures unit tests run independently and the CI/CD pipeline is more robust.

---

## Fix #2: Permission Issues with Allure Results

### Problem

Tests were failing with:
```
EACCES: permission denied, open 'allure-results/xxx-result.json'
```

**Root Cause**: Docker containers need write access to mounted volumes. When directories are mounted from the host, the container user may not have permission to write files.

### Solution

1. **Run test container as root** (simplified for test environment)
2. **Pre-create directories with proper permissions** on host
3. **Added permission fix script** for local development

### Changes Made

#### 1. `Dockerfile.test`

Removed non-root user setup for test container:
```dockerfile
# Before
USER nestjs

# After
# Running as root for test container simplicity
```

#### 2. Created `scripts/fix-permissions.sh`

Helper script to fix local directory permissions:
```bash
#!/bin/bash
mkdir -p allure-results allure-report logs
chmod -R 777 allure-results allure-report logs
```

#### 3. Updated GitHub Actions Workflow

Added permission setup step to all test jobs:
```yaml
- name: Prepare test directories
  run: |
    mkdir -p allure-results allure-report logs
    chmod -R 777 allure-results allure-report logs
```

### Local Usage

If you get permission errors:

```bash
# Quick fix
./scripts/fix-permissions.sh

# Or manually
chmod -R 777 allure-results allure-report logs
```

### Why This Approach

**Alternative considered**: Run as non-root user with matching UIDs
- More complex setup
- Requires user to set UID/GID environment variables
- Overkill for test environment

**Chosen approach**: Run as root in test container
- Simpler configuration
- Test containers are ephemeral and isolated
- Not a security concern (vs. production containers)
- Works consistently across all environments

### Security Note

This is **only** for the test environment (`Dockerfile.test`). The production Dockerfile (`Dockerfile`) still uses a non-root user for security best practices.
