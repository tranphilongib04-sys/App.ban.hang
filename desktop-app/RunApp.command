#!/bin/bash
cd "$(dirname "$0")"
echo "Cleaning up port 3210..."
lsof -ti:3210 | xargs kill -9 2>/dev/null || true

echo "⏳ Creating Daily Backup..."
npx tsx -r dotenv/config scripts/export_db_to_backup.ts

echo "Starting TPB Manage..."
npm run electron:dev
