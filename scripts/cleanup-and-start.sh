#!/bin/bash
# cleanup-and-start.sh

# Cleanup port 3210
echo "Checking port 3210..."
PID=$(lsof -ti:3210)
if [ -n "$PID" ]; then
  echo "Killing process $PID on port 3210"
  kill -9 $PID
fi

# Start Next.js
echo "Starting Next.js on 3210..."
exec next dev --webpack -p 3210 -H 127.0.0.1
