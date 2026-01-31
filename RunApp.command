#!/bin/bash
cd "$(dirname "$0")"
echo "Cleaning up port 3210..."
lsof -ti:3210 | xargs kill -9 2>/dev/null || true
echo "Starting TPB Manage..."
npm run electron:dev
