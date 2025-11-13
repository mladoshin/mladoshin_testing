#!/bin/sh
# Database initialization script for Docker environments
# Checks if database is already initialized to avoid migration conflicts
# Set FORCE_RESET=true to force database reset

set -e

echo "🔍 Checking database state..."

# Check if force reset is requested
if [ "$FORCE_RESET" = "true" ]; then
  echo "⚠️  FORCE_RESET=true - Running database reset..."
  ./scripts/reset-db.sh
  exit 0
fi

# Check if migrations table exists
MIGRATIONS_EXIST=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations');" 2>/dev/null || echo "f")

if [ "$MIGRATIONS_EXIST" = "t" ]; then
  echo "✅ Database already initialized (migrations table exists)"

  # Check if there are pending migrations
  echo "🔄 Checking for pending migrations..."
  pnpm migration:run || echo "⚠️  No new migrations to run or migration failed"
else
  echo "🚀 Initializing database for the first time..."

  # Run migrations
  echo "📦 Running migrations..."
  pnpm migration:run

  # Run seeds
  echo "🌱 Running seeds..."
  pnpm seed:run
fi

# Update PostgreSQL function (optional, may fail)
echo "🔧 Updating PostgreSQL functions..."
pnpm pg:update-function || echo "⚠️  Skipping pg:update-function"

echo "✅ Database initialization complete!"
