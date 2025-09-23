#!/bin/bash
set -e

# Production startup script for Azure App Service
export NODE_ENV=production

echo "Starting CodeConnect in production mode..."
echo "Server directory: $(pwd)/dist/server"
echo "Static files directory: $(pwd)/dist/public"

# Start the production server
node dist/server/index.js