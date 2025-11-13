#!/bin/bash
# Script to fix permissions for Docker volume mount directories

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo "Fixing permissions for test result directories..."

# Create directories if they don't exist
mkdir -p "$BACKEND_DIR/allure-results"
mkdir -p "$BACKEND_DIR/allure-report"
mkdir -p "$BACKEND_DIR/logs"

# Set permissions to allow Docker container to write
chmod -R 777 "$BACKEND_DIR/allure-results" 2>/dev/null || true
chmod -R 777 "$BACKEND_DIR/allure-report" 2>/dev/null || true
chmod -R 777 "$BACKEND_DIR/logs" 2>/dev/null || true

echo "✅ Permissions fixed!"
echo "   - allure-results/"
echo "   - allure-report/"
echo "   - logs/"
