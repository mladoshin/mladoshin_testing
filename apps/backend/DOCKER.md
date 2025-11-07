# Docker Setup for Backend

This guide explains how to run the backend application and tests in Docker containers.

## Important: Monorepo Structure

This backend is part of a **pnpm workspace monorepo**. The Docker build context must be the **repository root** (two levels up from this directory) to access:
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- Workspace packages in `packages/`

All commands should be run from the `apps/backend/` directory, but the build context points to `../..`

## Files Overview

- `Dockerfile` - Production-ready backend application image (uses pnpm workspace)
- `Dockerfile.test` - Test runner image with all dev dependencies (uses pnpm workspace)
- `docker-compose.test.yml` - Complete test environment (database + backend + test runner)
- `.env.docker.test` - Environment variables for Docker test environment
- `.dockerignore` - Files to exclude from Docker builds (in repository root)

## Quick Start - Running Tests in Docker

### 1. Run unit tests (no database required)
```bash
docker compose -f docker-compose.test.yml run --rm test-runner-unit --build
```

This will:
- Build the test runner image with all dependencies
- Run unit tests in parallel (4 workers)
- No database or external dependencies needed
- Generate Allure test results in `./allure-results`

### 2. Run all tests with database
```bash
docker compose -f docker-compose.test.yml up test-runner --build
```

This will:
- Build the PostgreSQL database with Python extensions
- Start the test database and wait for it to be healthy
- Run all tests in parallel (4 workers)
- Generate Allure test results in `./allure-results`

### 3. Run specific test modes

**Unit tests only (fast, no database):**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner-unit
```

**Integration tests (with database):**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration
```

**E2E tests (with full stack):**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:e2e
```

**Sequential tests:**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:sequential
```

**Randomized tests:**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:parallel:random
```

**Specific test file:**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:parallel -- auth.service.spec.ts
```

### 4. View test results

After tests complete, view the Allure report:
```bash
# Generate report from results
pnpm run allure:append

# Open the report
pnpm run allure:show
```

Note: Run these commands on your **host machine**, not inside Docker, as the volumes are mounted to `./allure-results` and `./allure-report`.

## Running Backend Application in Docker

### Production mode
```bash
# Build and start
docker compose -f docker-compose.test.yml up backend-test --build

# Access at http://localhost:3000/api
```

### With live database
```bash
# Start only database
docker compose -f docker-compose.test.yml up postgres-test -d

# Backend will connect to postgres-test:5432
```

## Environment Configuration

The `.env.docker.test` file contains Docker-specific settings:

- `POSTGRES_HOST=postgres-test` - Uses Docker service name instead of localhost
- `POSTGRES_PORT=5432` - Internal container port (mapped to 5435 on host)
- Test credentials (user: test_user, password: test_password)

**Important:** Inside Docker containers, services communicate using service names (e.g., `postgres-test`), not `localhost`.

## Database Setup

The PostgreSQL container:
- Uses custom `Dockerfile.postgres` with Python extensions
- Loads the `function.sql` for user scheduling features
- Runs health checks to ensure it's ready before tests start
- Persists data in the `pgdata-test` volume

## Cleanup

```bash
# Stop all containers
docker compose -f docker-compose.test.yml down

# Remove volumes (database data)
docker compose -f docker-compose.test.yml down -v

# Remove all (containers, volumes, images)
docker compose -f docker-compose.test.yml down -v --rmi all
```

## Troubleshooting

### Permission issues with test results

If you see errors like `EACCES: permission denied, open 'allure-results/...'`:

**Quick fix:**
```bash
# Run the permission fix script
./scripts/fix-permissions.sh
```

**Manual fix:**
```bash
# Fix permissions for mounted volumes
chmod -R 777 allure-results allure-report logs

# Or fix ownership of generated files
sudo chown -R $USER:$USER allure-results allure-report logs
```

**Why this happens:**
- Docker volumes are mounted from host to container
- The test container needs write access to these directories
- The test container runs as root for simplicity in test environment

### Tests fail to connect to database
- Ensure PostgreSQL container is healthy: `docker compose -f docker-compose.test.yml ps`
- Check logs: `docker compose -f docker-compose.test.yml logs postgres-test`

### Rebuild containers after code changes
```bash
docker compose -f docker-compose.test.yml up test-runner --build --force-recreate
```

### Debug inside test container
```bash
# Start an interactive shell
docker compose -f docker-compose.test.yml run --rm test-runner sh

# Then run commands manually
npm run test:parallel
```

## CI/CD Integration

### GitHub Actions Workflow

The repository includes a complete GitHub Actions workflow (`.github/workflows/test.yml`) that:

1. **Runs tests in stages**: unit → integration → e2e
2. **Stops on failure**: If any stage fails, subsequent stages are skipped
3. **Generates Allure reports**: Even when tests fail, a report is generated with skipped stages marked
4. **Deploys to GitHub Pages**: Test reports are published automatically

#### Test Execution Order

```
Unit Tests (parallel)
    ↓ (pass)
Integration Tests (with PostgreSQL)
    ↓ (pass)
E2E Tests (full stack)
    ↓ (always)
Generate Allure Report
```

If a stage fails:
- Subsequent stages are **skipped** (not run)
- Allure report shows skipped stages with explanation
- Workflow fails with clear indication of which stage failed

#### Running Specific Test Stages Locally

```bash
# Unit tests only (no database required, fastest)
docker compose -f docker-compose.test.yml run --rm test-runner-unit

# Integration tests (requires PostgreSQL)
docker compose -f docker-compose.test.yml up -d postgres-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration
docker compose -f docker-compose.test.yml down

# E2E tests (requires full stack)
docker compose -f docker-compose.test.yml up -d postgres-test backend-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:e2e
docker compose -f docker-compose.test.yml down
```

### Manual CI/CD Simulation

To simulate the CI/CD pipeline locally:

```bash
#!/bin/bash
set -e

echo "Running Unit Tests..."
docker compose -f docker-compose.test.yml run --rm test-runner-unit || {
  echo "Unit tests failed. Stopping pipeline."
  ./scripts/create-skipped-tests.sh integration
  ./scripts/create-skipped-tests.sh e2e
  exit 1
}

echo "Running Integration Tests..."
docker compose -f docker-compose.test.yml up -d postgres-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration || {
  echo "Integration tests failed. Stopping pipeline."
  ./scripts/create-skipped-tests.sh e2e
  docker compose -f docker-compose.test.yml down -v
  exit 1
}

echo "Running E2E Tests..."
docker compose -f docker-compose.test.yml up -d backend-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:e2e || {
  echo "E2E tests failed."
  docker compose -f docker-compose.test.yml down -v
  exit 1
}

echo "All tests passed!"
docker compose -f docker-compose.test.yml down -v

# Generate report
pnpm run allure:append
pnpm run allure:show
```

### Viewing CI/CD Results

After a workflow run:
1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. View **Summary** for test stage results
4. Download **allure-report** artifact
5. If on `main` branch, view live report at: `https://<username>.github.io/<repo>/`

## Port Mappings

- PostgreSQL: `5435:5432` (host:container)
- Backend: `3000:3000` (host:container)

Access the database from your host machine:
```bash
psql -h localhost -p 5435 -U test_user -d school_test_db
```
