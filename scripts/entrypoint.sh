#!/bin/sh
set -e

echo "=================================================="
echo "🚀 Initializing Application Container..."
echo "=================================================="

# Check if DATABASE_URL is configured
if [ -n "$DATABASE_URL" ]; then
  echo "📡 DATABASE_URL detected. Synchronizing database with Drizzle ORM..."
  node scripts/sync-db.mjs
else
  echo "ℹ️ No DATABASE_URL found. Running in standalone/in-memory mode."
fi

echo "=================================================="
echo "🌐 Starting Next.js Production Server on port ${PORT:-3000}..."
echo "=================================================="
exec node server.js
