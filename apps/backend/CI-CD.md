# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and testing. The pipeline runs tests in three stages with automatic Allure reporting.

## Pipeline Architecture

### Test Stages

The pipeline executes tests in the following order:

```
┌─────────────────┐
│   Unit Tests    │  ← Fast, no external dependencies
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Integration     │  ← With PostgreSQL database
│     Tests       │
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│   E2E Tests     │  ← Full application stack
└────────┬────────┘
         │ ALWAYS
         ▼
┌─────────────────┐
│ Generate Allure │  ← Comprehensive test report
│     Report      │
└─────────────────┘
```

### Failure Handling

**Critical Requirement**: If any stage fails, subsequent stages are **skipped** (not executed).

| Unit Tests | Integration Tests | E2E Tests | Report Generation |
|------------|-------------------|-----------|-------------------|
| ✅ Pass    | ✅ Run            | ✅ Run    | ✅ All results    |
| ❌ Fail    | ⏭️ Skip           | ⏭️ Skip   | ✅ With skipped   |
| ✅ Pass    | ❌ Fail           | ⏭️ Skip   | ✅ With skipped   |
| ✅ Pass    | ✅ Pass           | ❌ Fail   | ✅ All results    |

**Important**: The report generation step **always runs**, even when tests fail. Skipped stages are marked as "skipped" in the Allure report with explanatory messages.

## Workflow File

Location: `.github/workflows/test.yml`

### Jobs

#### 1. `unit-tests`
- **Runs**: Always on push/PR
- **Environment**: Docker container (test-runner)
- **Database**: Not required
- **Command**: `pnpm run test:unit`
- **Outcome**: If fails → stops pipeline

#### 2. `integration-tests`
- **Runs**: Only if `unit-tests` passes
- **Environment**: Docker containers (test-runner + postgres-test)
- **Database**: PostgreSQL with test schema
- **Command**: `pnpm run test:integration`
- **Outcome**: If fails → stops pipeline, skips E2E

#### 3. `e2e-tests`
- **Runs**: Only if `integration-tests` passes
- **Environment**: Full stack (test-runner + postgres-test + backend-test)
- **Database**: PostgreSQL with test data
- **Command**: `pnpm run test:e2e`
- **Outcome**: If fails → marks workflow as failed

#### 4. `generate-report`
- **Runs**: Always (even if tests fail)
- **Dependencies**: `unit-tests`, `integration-tests`, `e2e-tests`
- **Actions**:
  1. Downloads all test result artifacts
  2. Merges results from all stages
  3. Creates markers for skipped stages
  4. Generates unified Allure report
  5. Uploads report as artifact
  6. Deploys to GitHub Pages (main branch only)

## Test Scripts

Added to `package.json`:

```json
{
  "test:unit": "jest --testPathPattern=tests/unit --maxWorkers=4",
  "test:integration": "jest --testPathPattern=tests/integration --maxWorkers=4",
  "test:e2e": "jest --config ./tests/e2e/jest-e2e.json"
}
```

## Skipped Test Markers

When a stage is skipped, the workflow creates Allure-compatible JSON files that appear in the report as:

```
Integration Tests (Skipped - Unit tests failed)
  Status: skipped
  Message: This test stage was skipped because a previous stage failed
```

This is handled by:
- Workflow logic checking `needs.<job>.result`
- Helper script: `scripts/create-skipped-tests.sh`

## Allure Report Features

The generated report includes:

1. **Test Results**: All executed tests with pass/fail status
2. **Skipped Markers**: Clear indication of which stages didn't run
3. **Trends**: Historical data across runs
4. **Suites**: Organized by test type (unit/integration/e2e)
5. **Timeline**: Execution timeline for all tests
6. **Categories**: Failures grouped by type

## Triggering the Pipeline

### Automatic Triggers

The workflow runs automatically on:

```yaml
# Push to specific branches
push:
  branches: [ main, develop, lab_02 ]
  paths:
    - 'apps/backend/**'
    - 'packages/**'
    - '.github/workflows/test.yml'

# Pull requests to main/develop
pull_request:
  branches: [ main, develop ]
  paths:
    - 'apps/backend/**'
    - 'packages/**'
```

### Manual Trigger

To run the workflow manually:
1. Go to **Actions** tab in GitHub
2. Select "Backend Tests CI/CD"
3. Click "Run workflow"
4. Select branch and run

## Viewing Results

### In GitHub UI

1. Navigate to **Actions** tab
2. Click on workflow run
3. View job summaries:
   ```
   ✅ unit-tests
   ✅ integration-tests
   ❌ e2e-tests
   ✅ generate-report
   ```

### Downloading Artifacts

Each job uploads artifacts:
- `unit-test-results` - Unit test Allure results
- `integration-test-results` - Integration test Allure results
- `e2e-test-results` - E2E test Allure results
- `allure-report` - Complete HTML report

To download:
1. Click on workflow run
2. Scroll to "Artifacts" section
3. Download `allure-report`
4. Extract and open `index.html`

### GitHub Pages (Live Report)

For `main` branch only, reports are automatically published to:
```
https://<username>.github.io/<repository>/
```

Setup required:
1. Go to **Settings** → **Pages**
2. Source: Deploy from branch `gh-pages`
3. Wait for deployment (~1-2 minutes)

## Local Testing

### Run individual stages

```bash
# Unit tests
cd apps/backend
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:unit

# Integration tests (needs database)
docker compose -f docker-compose.test.yml up -d postgres-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration
docker compose -f docker-compose.test.yml down

# E2E tests (needs full stack)
docker compose -f docker-compose.test.yml up -d postgres-test backend-test
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:e2e
docker compose -f docker-compose.test.yml down
```

### Simulate full pipeline

Use the example script from `DOCKER.md` or create `run-ci-locally.sh`:

```bash
#!/bin/bash
cd apps/backend

echo "🧪 Starting CI/CD Pipeline Simulation..."

# Unit Tests
echo "▶️  Running Unit Tests..."
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:unit
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Pipeline stopped."
  ./scripts/create-skipped-tests.sh integration
  ./scripts/create-skipped-tests.sh e2e
  exit 1
fi
echo "✅ Unit tests passed"

# Integration Tests
echo "▶️  Running Integration Tests..."
docker compose -f docker-compose.test.yml up -d postgres-test
sleep 5
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration
INTEGRATION_EXIT=$?
docker compose -f docker-compose.test.yml down -v

if [ $INTEGRATION_EXIT -ne 0 ]; then
  echo "❌ Integration tests failed. Pipeline stopped."
  ./scripts/create-skipped-tests.sh e2e
  exit 1
fi
echo "✅ Integration tests passed"

# E2E Tests
echo "▶️  Running E2E Tests..."
docker compose -f docker-compose.test.yml up -d postgres-test backend-test
sleep 10
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:e2e
E2E_EXIT=$?
docker compose -f docker-compose.test.yml down -v

if [ $E2E_EXIT -ne 0 ]; then
  echo "❌ E2E tests failed."
  exit 1
fi
echo "✅ E2E tests passed"

echo "🎉 All tests passed! Generating report..."
pnpm run allure:append
pnpm run allure:show
```

## Troubleshooting

### Pipeline doesn't trigger
- Check if file changes match paths in workflow triggers
- Verify branch name matches trigger configuration
- Check workflow file syntax: `yamllint .github/workflows/test.yml`

### Tests fail in CI but pass locally
- Check environment variables in `.env.docker.test`
- Verify Docker images are building correctly
- Review service health checks and timing
- Check PostgreSQL initialization

### Allure report shows all tests as skipped
- Verify test results are being uploaded as artifacts
- Check artifact download step succeeded
- Ensure JSON files are in correct Allure format

### GitHub Pages not deploying
- Enable GitHub Pages in repository settings
- Check `gh-pages` branch exists after workflow run
- Verify `GITHUB_TOKEN` has sufficient permissions
- May need to wait 1-2 minutes for deployment

## Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/test.yml` | Main CI/CD workflow |
| `apps/backend/docker-compose.test.yml` | Test environment definition |
| `apps/backend/Dockerfile.test` | Test runner image |
| `apps/backend/.env.docker.test` | Test environment variables |
| `apps/backend/scripts/create-skipped-tests.sh` | Skipped test marker generator |
| `apps/backend/package.json` | Test scripts definition |

## Best Practices

1. **Always run tests locally** before pushing
2. **Keep stages fast**: Unit < 2min, Integration < 5min, E2E < 10min
3. **Fix broken tests immediately**: Don't let the main branch stay red
4. **Review Allure reports**: Check for flaky tests and trends
5. **Update test data**: Keep E2E test scenarios realistic

## Future Enhancements

- [ ] Add code coverage reporting
- [ ] Integrate with Slack/Discord for notifications
- [ ] Add performance benchmarking
- [ ] Matrix testing (multiple Node versions)
- [ ] Parallel test execution optimization
- [ ] Cache Docker layers for faster builds
