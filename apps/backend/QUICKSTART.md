# Quick Start Guide - Docker Tests

## First Time Setup

### 1. Fix permissions (one-time setup)

```bash
cd apps/backend
./scripts/fix-permissions.sh
```

This creates the necessary directories with correct permissions for Docker volume mounts.

### 2. Run unit tests (fastest, no database)

```bash
docker compose -f docker-compose.test.yml run --rm test-runner-unit --build
```

**Expected output:**
- Builds test image (~2-3 minutes first time)
- Runs unit tests (~30 seconds)
- Creates results in `allure-results/`

### 3. Run integration tests (with database)

```bash
# Start postgres
docker compose -f docker-compose.test.yml up -d postgres-test

# Wait for it to be healthy (check with docker ps)
docker ps

# Run tests
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration

# Cleanup
docker compose -f docker-compose.test.yml down -v
```

### 4. View test reports

```bash
pnpm run allure:append
pnpm run allure:show
```

## Common Issues

### Permission Denied Error

```
EACCES: permission denied, open 'allure-results/...'
```

**Fix:**
```bash
./scripts/fix-permissions.sh
```

### Postgres Not Healthy

```
dependency failed to start: container school_postgres_test is unhealthy
```

**Fix:**
```bash
# Check postgres logs
docker compose -f docker-compose.test.yml logs postgres-test

# Restart with clean volumes
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d postgres-test
```

### Build Fails

**Fix:**
```bash
# Clear Docker build cache
docker compose -f docker-compose.test.yml build --no-cache test-runner-unit
```

## Test Commands Reference

| Command | Description | Database Required |
|---------|-------------|-------------------|
| `docker compose -f docker-compose.test.yml run --rm test-runner-unit` | Unit tests only | ❌ No |
| `docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration` | Integration tests | ✅ Yes |
| `docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:e2e` | E2E tests | ✅ Yes + Backend |
| `docker compose -f docker-compose.test.yml up test-runner` | All tests | ✅ Yes |

## CI/CD Pipeline

When you push to GitHub:

1. ✅ **Unit Tests** - Run without database (fast)
2. ✅ **Integration Tests** - Run with PostgreSQL
3. ✅ **E2E Tests** - Run with full stack
4. 📊 **Allure Report** - Generated and published

View results in GitHub Actions tab.

## Tips

- **First run takes longer** - Docker images need to be built
- **Subsequent runs are faster** - Images are cached
- **Clean up volumes** - Use `docker compose down -v` to remove test data
- **Rebuild after changes** - Add `--build` flag to force rebuild
- **Run specific tests** - Add file pattern: `pnpm run test:unit -- auth.service`

## Full Test Cycle Example

```bash
# 1. Setup (one time)
./scripts/fix-permissions.sh

# 2. Unit tests (no DB)
docker compose -f docker-compose.test.yml run --rm test-runner-unit

# 3. Integration tests (with DB)
docker compose -f docker-compose.test.yml up -d postgres-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration
docker compose -f docker-compose.test.yml down -v

# 4. View report
pnpm run allure:append
pnpm run allure:show
```

## Next Steps

- Read [DOCKER.md](./DOCKER.md) for detailed Docker documentation
- Read [CI-CD.md](./CI-CD.md) for CI/CD pipeline details
- Read [FIXES.md](./FIXES.md) for troubleshooting solutions
