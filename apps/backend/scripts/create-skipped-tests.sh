#!/bin/bash
# Script to create Allure test result markers for skipped test stages

set -e

STAGE=$1
RESULTS_DIR=${2:-"allure-results"}

if [ -z "$STAGE" ]; then
  echo "Usage: $0 <stage_name> [results_dir]"
  echo "Example: $0 integration allure-results"
  exit 1
fi

mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%s%3N)
UUID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "00000000-0000-0000-0000-000000000000")

cat > "$RESULTS_DIR/${UUID}-container.json" <<EOF
{
  "uuid": "${UUID}",
  "name": "${STAGE} Tests Suite",
  "children": [],
  "befores": [],
  "afters": [],
  "start": ${TIMESTAMP},
  "stop": ${TIMESTAMP}
}
EOF

RESULT_UUID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "00000001-0000-0000-0000-000000000000")

cat > "$RESULTS_DIR/${RESULT_UUID}-result.json" <<EOF
{
  "uuid": "${RESULT_UUID}",
  "historyId": "${STAGE}-skipped-${TIMESTAMP}",
  "name": "${STAGE} Tests (Skipped)",
  "status": "skipped",
  "statusDetails": {
    "message": "This test stage was skipped because a previous stage failed",
    "trace": "Test execution stopped at previous stage"
  },
  "stage": "finished",
  "description": "${STAGE} tests were not executed because unit or integration tests failed",
  "start": ${TIMESTAMP},
  "stop": ${TIMESTAMP},
  "labels": [
    {
      "name": "suite",
      "value": "${STAGE} Tests"
    },
    {
      "name": "testClass",
      "value": "Skipped${STAGE}Tests"
    },
    {
      "name": "testMethod",
      "value": "skipped_due_to_previous_failure"
    },
    {
      "name": "package",
      "value": "ci.${STAGE}"
    },
    {
      "name": "epic",
      "value": "CI/CD Pipeline"
    },
    {
      "name": "feature",
      "value": "${STAGE} Testing"
    }
  ]
}
EOF

echo "Created skipped test markers for ${STAGE} stage in ${RESULTS_DIR}"
