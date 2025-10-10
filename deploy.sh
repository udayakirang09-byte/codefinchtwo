#!/bin/bash

# CodeConnect Deployment Script with Auto Database Sync
# This script verifies database changes and syncs to Azure before deployment

echo ""
echo "🚀 CodeConnect Deployment Assistant"
echo "===================================="
echo ""

# Run the verification and sync script
tsx server/verify-and-sync.ts

# Check if verification was successful
if [ $? -eq 0 ]; then
    echo "✅ Pre-deployment checks passed!"
    echo ""
    echo "📋 Deployment Checklist:"
    echo "  ✓ Schema changes verified"
    echo "  ✓ Database synced (if needed)"
    echo "  ✓ Ready to push to production"
    echo ""
    echo "🎯 Final Steps:"
    echo "  1. Run: git push"
    echo "  2. Deploy to Azure App Service"
    echo "  3. Verify production is running"
    echo ""
else
    echo "❌ Pre-deployment checks failed!"
    echo "Please fix the issues above before deploying."
    exit 1
fi
