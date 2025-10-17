#!/bin/bash
set -e

echo "Building CodeConnect for production..."

# Clean previous builds
rm -rf dist

# Build frontend
echo "Building frontend..."
npx vite build

# Build backend
echo "Building backend..."
tsc --project tsconfig.server.json

# Fix ESM imports for Node.js compatibility
echo "Fixing ESM imports for Node.js..."
node fix-esm-imports.js

echo "Production build complete!"
echo "Frontend built to: dist/public"
echo "Backend built to: dist/server"
echo ""
echo "To run in production:"
echo "  NODE_ENV=production node dist/server/index.js"