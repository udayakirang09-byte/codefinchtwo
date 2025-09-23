#!/bin/bash
set -e

# Production startup script for Azure App Service
export NODE_ENV=production

echo "Starting CodeConnect in production mode..."
echo "Server directory: $(pwd)/dist/server"
echo "Static files directory: $(pwd)/dist/public"

# Fix import paths for Node.js ESM (add .js extensions)
echo "Fixing import paths for Node.js ESM compatibility..."
find dist/server -name "*.js" -type f -exec sed -i "s/from '\\.\\//from '.\\/\\/g; s/from '\\.\\.\\//from '..\\/\\/g; s/'$/'.js'/g" {} \;
find dist/server -name "*.js" -type f -exec sed -i "s/from '\\.\\//from '.\\/'/g; s/\\([^.js]\\)';$/\\1.js';/g" {} \;

# Start the production server
node dist/server/index.js