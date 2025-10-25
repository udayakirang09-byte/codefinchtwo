#!/bin/bash

# Git Sync - Automatically sync code AND database with one command
# Usage: ./git-sync.sh "commit message"

set -e  # Exit on any error

COMMIT_MSG="${1:-Update project}"

echo ""
echo "🔄 Git Sync - Code + Database"
echo "=============================="
echo ""

# Step 1: Check for schema changes
echo "📋 Step 1: Checking for schema changes..."
if git diff --name-only HEAD shared/schema.ts 2>/dev/null | grep -q "shared/schema.ts" || \
   git diff --cached --name-only shared/schema.ts 2>/dev/null | grep -q "shared/schema.ts" || \
   git ls-files --others --exclude-standard shared/schema.ts 2>/dev/null | grep -q "shared/schema.ts"; then
    
    echo "✅ Schema changes detected - will sync database"
    SYNC_DB=true
else
    echo "✅ No schema changes - database sync not needed"
    SYNC_DB=false
fi

# Step 2: Sync database if needed
if [ "$SYNC_DB" = true ]; then
    echo ""
    echo "📊 Step 2: Syncing database to Azure..."
    echo "  → Pushing schema to source database..."
    npm run db:push --force 2>/dev/null || npm run db:push
    
    echo "  → Syncing data to Azure..."
    tsx server/sync-neon-to-azure.ts
    echo "✅ Database synced successfully"
fi

# Step 3: Git add all changes
echo ""
echo "📦 Step 3: Staging all changes..."
git add .
echo "✅ Changes staged"

# Step 4: Git commit
echo ""
echo "💾 Step 4: Committing changes..."
git commit -m "$COMMIT_MSG" || {
    echo "ℹ️  Nothing to commit or commit failed"
    exit 0
}
echo "✅ Changes committed"

# Step 5: Git push
echo ""
echo "🚀 Step 5: Pushing to remote..."
git push
echo "✅ Pushed to remote"

echo ""
echo "=============================="
echo "✨ Sync Complete!"
echo ""
echo "What happened:"
if [ "$SYNC_DB" = true ]; then
    echo "  ✅ Database synced to Azure"
fi
echo "  ✅ Code committed: '$COMMIT_MSG'"
echo "  ✅ Pushed to remote repository"
echo ""
