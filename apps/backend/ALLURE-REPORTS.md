# Allure Test Reports - Complete Guide

## Overview

This project generates comprehensive Allure test reports for all test runs, both locally and in CI/CD.

## Viewing Reports from CI/CD

### Option 1: Download Artifact (Recommended)

**Steps:**
1. Go to GitHub repository → **Actions** tab
2. Click on any workflow run
3. Scroll to bottom → **Artifacts** section
4. Click **allure-report** to download (ZIP file)
5. Extract the ZIP file
6. Open `index.html` in a browser

**Example:**
```bash
# After downloading allure-report.zip
unzip allure-report.zip -d allure-report
open allure-report/index.html  # macOS
```

**Pros:**
✅ Works immediately - no setup needed
✅ Available for all branches
✅ Download once, view offline
✅ Keep historical reports locally

**Cons:**
❌ Manual download required
❌ Takes up local disk space

---

### Option 2: GitHub Pages (Live URL)

**One-Time Setup:**
1. Go to repository **Settings**
2. Click **Pages** in left sidebar
3. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes for deployment

**Access Report:**
```
https://<username>.github.io/<repository-name>/latest/
```

**Example:**
```
https://mladoshin.github.io/ppo-course/latest/
```

**Pros:**
✅ No download needed
✅ Always up-to-date
✅ Shareable URL
✅ Professional presentation
✅ Historical trends preserved

**Cons:**
❌ Requires one-time setup
❌ Public (if repo is public)

---

## Report Contents

### What's Included

1. **Test Suites**
   - Unit Tests
   - Integration Tests
   - E2E Tests

2. **Test Results**
   - Total tests run
   - Passed / Failed / Skipped
   - Execution time
   - Failure reasons with stack traces

3. **Trends & History**
   - Success rate over time
   - Duration trends
   - Flaky test detection

4. **Categories**
   - Product defects
   - Test defects
   - Known issues

5. **Timeline**
   - When each test ran
   - Parallel execution visualization

### Skipped Stages

If a stage fails, subsequent stages are marked as **Skipped** in the report:

```
✅ Unit Tests - 45 passed
❌ Integration Tests - 3 failed, 12 passed
⏭️ E2E Tests - SKIPPED (Integration failed)
```

Skipped tests appear in the report with explanation:
> "E2E Tests (Skipped - Previous stage failed)"

---

## Generating Reports Locally

### After Running Tests

```bash
cd apps/backend

# Run tests (results saved to allure-results/)
docker compose -f docker-compose.test.yml run --rm test-runner-unit

# Generate report from results
pnpm run allure:append

# Open report in browser
pnpm run allure:show
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm run allure:prepare` | Prepare history before tests |
| `pnpm run allure:append` | Generate report (keeps history) |
| `pnpm run allure:show` | Open report in browser |
| `pnpm run allure:clean` | Delete all results and reports |

### Manual Report Generation

If you have `allure` CLI installed:

```bash
# Generate report
allure generate allure-results -o allure-report --clean

# Serve report
allure open allure-report
```

---

## Troubleshooting

### No Artifacts in GitHub Actions

**Cause**: Tests didn't generate results or permission issues

**Solutions:**
1. Check test execution logs for errors
2. Verify permissions: `./scripts/fix-permissions.sh`
3. Check volume mounts in docker-compose.test.yml

### GitHub Pages Not Working

**Symptom**: 404 error on GitHub Pages URL

**Solutions:**
1. Verify GitHub Pages is enabled in Settings
2. Check `gh-pages` branch exists
3. Wait 2-3 minutes after first workflow run
4. Check Actions → Pages build for errors

### Report Shows "No Tests"

**Cause**: Allure results directory was empty

**Solutions:**
1. Verify tests actually ran: check workflow logs
2. Check `allure-results/` directory exists locally
3. Ensure Allure Jest reporter is configured in `jest.config.ts`

### Historical Data Missing

**Cause**: `allure-report/history` was deleted

**Fix:**
```bash
# Before running tests, preserve history
pnpm run allure:prepare
```

---

## Understanding the Report

### Dashboard

Main page shows:
- **Total tests**: All tests that ran
- **Success rate**: Percentage passed
- **Duration**: Total execution time
- **Flaky**: Tests that sometimes fail

### Suites

Organized by:
- **Epic**: Major feature area
- **Feature**: Specific functionality
- **Story**: User story or requirement

Each test shows:
- Status (passed/failed/skipped)
- Duration
- Parameters
- Steps (for detailed tests)
- Attachments (screenshots, logs)

### Timeline

Shows when tests ran in parallel:
- Vertical axis: Test name
- Horizontal axis: Time
- Overlapping bars: Parallel execution

### Trends

Graphs showing:
- Pass/fail rate over time
- Duration changes
- Flaky test identification

---

## Best Practices

### For Developers

1. **Run tests locally** before pushing
   ```bash
   ./scripts/fix-permissions.sh
   docker compose -f docker-compose.test.yml run --rm test-runner-unit
   pnpm run allure:show
   ```

2. **Check report trends** to catch flaky tests early

3. **Add descriptions** to tests for better reports
   ```typescript
   test('should validate user input', async () => {
     // Good: Clear, descriptive name
   });
   ```

### For CI/CD

1. **Always generate reports** - even when tests fail
2. **Preserve history** - keep trends data
3. **Share GitHub Pages URL** with team
4. **Monitor flaky tests** - fix intermittent failures

---

## Advanced Configuration

### Custom Categories

Edit `allure-results/categories.json` to define failure categories:

```json
[
  {
    "name": "Product defects",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*AssertionError.*"
  }
]
```

### Environment Info

Add `allure-results/environment.properties`:

```properties
Browser=Chrome 120
Platform=Ubuntu 22.04
NodeJS=20.10.0
Database=PostgreSQL 15
```

---

## Resources

- **Allure Documentation**: https://docs.qameta.io/allure/
- **Allure Jest**: https://www.npmjs.com/package/allure-jest
- **GitHub Pages**: https://docs.github.com/en/pages

## Questions?

See [FIXES.md](./FIXES.md) for solutions to common issues or [CI-CD.md](./CI-CD.md) for pipeline details.
