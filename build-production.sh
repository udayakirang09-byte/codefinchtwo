#!/bin/bash
set -e

echo "Building CodeConnect for production..."

# Clean previous builds
rm -rf dist

# Build frontend
echo "Building frontend..."
npx vite build

# Copy public assets to dist (logo, images, etc.)
echo "Copying public assets..."
if [ -f "client/public/logo.png" ]; then
  cp client/public/logo.png dist/public/logo.png
  echo "✅ Copied logo.png"
fi

if [ -f "client/public/hero-image.png" ]; then
  cp client/public/hero-image.png dist/public/hero-image.png
  echo "✅ Copied hero-image.png"
fi

# Build backend
echo "Building backend..."
tsc --project tsconfig.server.json

# Fix ESM imports for Node.js compatibility
echo "Fixing ESM imports for Node.js..."
node fix-esm-imports.js

echo "Production build complete!"
echo "Frontend built to: dist/public"
echo "Backend built to: dist/server"
echo "✅ Public assets copied: logo.png, hero-image.png"
echo ""
echo "To run in production:"
echo "  NODE_ENV=production node dist/server/index.js"