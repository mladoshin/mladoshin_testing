#!/bin/sh
# Script to completely reset the database
# WARNING: This will drop all tables and data!

set -e

echo "⚠️  RESETTING DATABASE - ALL DATA WILL BE LOST!"

# Drop all tables in public schema
echo "🗑️  Dropping all tables..."
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} <<-EOSQL
  DO \$\$ DECLARE
    r RECORD;
  BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
      EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
      EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;

    -- Drop all functions
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') LOOP
      EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
  END \$\$;
EOSQL

echo "✅ Database cleared!"

# Run migrations
echo "📦 Running migrations..."
pnpm migration:run

# Run seeds
echo "🌱 Running seeds..."
pnpm seed:run

# Update PostgreSQL function
echo "🔧 Updating PostgreSQL functions..."
pnpm pg:update-function || echo "⚠️  Skipping pg:update-function"

echo "✅ Database reset complete!"
