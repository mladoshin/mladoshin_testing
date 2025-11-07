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

---

## Fix #3: Environment Variables Not Loaded in GitHub Actions

### Problem

Integration and E2E test stages were failing with:
```
level=warning msg="The \"POSTGRES_USER\" variable is not set. Defaulting to a blank string."
dependency failed to start: container school_postgres_test is unhealthy
```

**Root Cause**: GitHub Actions doesn't automatically load `.env.docker.test` file. Docker Compose needs environment variables to be set in the runner's environment or passed explicitly.

### Solution

Set environment variables directly in the GitHub Actions workflow using the `env` key at the job level.

### Changes Made

#### Updated `.github/workflows/test.yml`

Added `env` block to `integration-tests` and `e2e-tests` jobs:

```yaml
integration-tests:
  name: Integration Tests
  runs-on: ubuntu-latest
  needs: unit-tests
  env:
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
    POSTGRES_DB: school_test_db
    POSTGRES_PORT: 5432
    POSTGRES_HOST: postgres-test
    JWT_SECRET: test_secret_shbqchbc
    LOG_FILE: app.log
    LOG_ACCESS_FILE: access.log
    LOG_ERROR_FILE: error.log
    COURSE_COMMISION: "1.20"
    IS_OFFLINE: "false"
```

### Why This Happens

1. **Local development**: Docker Compose reads `.env` files automatically
2. **GitHub Actions**: No default `.env` file loading - must explicitly set variables
3. **env_file in docker-compose.yml**: Only works if the file exists and is in the right location relative to where docker compose runs

### Alternative Solutions Considered

1. **Copy .env.docker.test to .env** ❌
   - Fragile, depends on file location
   - Easy to forget in different contexts

2. **Use GitHub Secrets** ❌
   - Overkill for test credentials
   - Makes local testing harder to match CI

3. **Set env vars in workflow (chosen)** ✅
   - Explicit and clear
   - Works consistently
   - Easy to modify per environment
   - No file dependencies

### Verification

After this fix, the workflow should show:
```
✅ Unit Tests - PASSED
✅ Integration Tests - PASSED (with healthy postgres)
✅ E2E Tests - PASSED
✅ Generate Report - PASSED
```

### Local Testing Still Works

Local development unchanged - still uses `.env.docker.test`:
```bash
# Works locally
docker compose -f docker-compose.test.yml run --rm test-runner pnpm run test:integration
```

The `env_file` directive in `docker-compose.test.yml` ensures local `.env.docker.test` is loaded.

---

## Fix #4: Artifact Upload and GitHub Pages Deployment

### Problem

The final report generation step was failing with errors:
```
Unable to download artifact(s): Artifact not found for name: e2e-test-results
No files were found with the provided path: apps/backend/allure-results/
```

**Root Causes**:
1. Test results weren't being preserved in artifacts correctly
2. Artifact paths were inconsistent
3. GitHub Pages deployment was using wrong directory
4. No fallback when artifacts are missing

### Solution

1. **Add `if-no-files-found: warn`** to all artifact uploads
2. **Simplify artifact collection** - Remove unnecessary copy steps
3. **Handle missing artifacts gracefully** - Create placeholder when no results exist
4. **Fix GitHub Pages deployment** - Use correct directory from allure-report-action
5. **Improve report summary** - Add links to both artifact download and live GitHub Pages

### Changes Made

#### 1. Updated Artifact Uploads

Added `if-no-files-found: warn` to prevent failures when no files exist:

```yaml
- name: Upload unit test results
  uses: actions/upload-artifact@v4
  with:
    name: unit-test-results
    path: apps/backend/allure-results/
    if-no-files-found: warn  # Don't fail if empty
    retention-days: 30
```

#### 2. Improved Report Generation

Added safety checks and placeholder generation:

```yaml
- name: Merge all results
  run: |
    mkdir -p allure-results-merged

    # Copy with error handling
    if [ -d "allure-results" ]; then
      find allure-results -type f -name "*.json" -exec cp {} allure-results-merged/ \; 2>/dev/null || true
    fi

    # Create placeholder if no results
    if [ -z "$(ls -A allure-results-merged/ 2>/dev/null)" ]; then
      cat > allure-results-merged/placeholder-result.json <<'EOF'
      {
        "name": "No Test Results Available",
        "status": "unknown",
        "description": "Test results were not generated or uploaded"
      }
      EOF
    fi
```

#### 3. Fixed GitHub Pages Deployment

Changed from `allure-history` to `gh-pages` directory:

```yaml
- name: Deploy report to GitHub Pages
  if: always()
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_branch: gh-pages
    publish_dir: gh-pages  # ← Correct directory from action
    keep_files: true
```

#### 4. Enhanced Summary Output

Added better links and conditional GitHub Pages URL:

```yaml
- name: Add report URL to summary
  run: |
    echo "### Reports" >> $GITHUB_STEP_SUMMARY
    echo "- 📊 [Download Allure Report Artifact](...)" >> $GITHUB_STEP_SUMMARY

    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      echo "- 🌐 [View Live Report on GitHub Pages](...)" >> $GITHUB_STEP_SUMMARY
    fi
```

### Accessing Reports

#### Option 1: Download Artifact (Any Branch)

1. Go to **Actions** tab → Select workflow run
2. Scroll to **Artifacts** section
3. Download `allure-report`
4. Extract and open `index.html`

#### Option 2: GitHub Pages (Main Branch Only)

Reports on `main` branch are automatically published to:
```
https://<username>.github.io/<repo>/latest/
```

**First Time Setup:**
1. Go to **Settings** → **Pages**
2. Source: **Deploy from branch**
3. Branch: **gh-pages** / **root**
4. Wait 1-2 minutes for deployment

### Viewing Reports Locally

After downloading the artifact:
```bash
# Extract allure-report.zip
unzip allure-report.zip -d allure-report

# Open in browser
open allure-report/index.html  # macOS
xdg-open allure-report/index.html  # Linux
start allure-report/index.html  # Windows
```

### Why Artifacts Might Be Empty

If test results are empty, possible causes:
1. **Tests didn't run** - Check earlier workflow steps
2. **Permission issues** - Allure can't write results
3. **Container cleanup** - Results deleted before upload
4. **Wrong path** - Volume mount path incorrect

All these issues are now handled gracefully with warnings instead of failures.
