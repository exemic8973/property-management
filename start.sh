#!/bin/sh

if [ "$SERVICE_TYPE" = "frontend" ]; then
  echo "Starting frontend service..."
  cd /app/frontend-standalone && node apps/frontend/server.js
else
  echo "Starting backend service..."
  node /app/apps/backend/dist/main.js
fi
