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

### 1. Run all tests in Docker
```bash
docker compose -f docker-compose.test.yml up test-runner --build
```

This will:
- Build the PostgreSQL database with Python extensions
- Start the test database and wait for it to be healthy
- Run all tests in parallel (4 workers)
- Generate Allure test results in `./allure-results`

### 2. Run specific test modes

**Sequential tests:**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:sequential
```

**Randomized tests:**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:parallel:random
```

**Offline mode (skip integration tests):**
```bash
docker compose -f docker-compose.test.yml run --rm -e IS_OFFLINE=true test-runner pnpm run test:parallel
```

**Specific test file:**
```bash
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:parallel -- auth.service.spec.ts
```

### 3. View test results

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

### Tests fail to connect to database
- Ensure PostgreSQL container is healthy: `docker compose -f docker-compose.test.yml ps`
- Check logs: `docker compose -f docker-compose.test.yml logs postgres-test`

### Permission issues with test results
```bash
# Fix ownership of generated files
sudo chown -R $USER:$USER allure-results allure-report
```

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

For continuous integration:

```bash
# Run tests and capture exit code
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:parallel
EXIT_CODE=$?

# Cleanup
docker compose -f docker-compose.test.yml down -v

exit $EXIT_CODE
```

## Port Mappings

- PostgreSQL: `5435:5432` (host:container)
- Backend: `3000:3000` (host:container)

Access the database from your host machine:
```bash
psql -h localhost -p 5435 -U test_user -d school_test_db
```
