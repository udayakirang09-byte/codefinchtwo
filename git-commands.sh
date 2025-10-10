#!/bin/bash

# Git Commands Helper - All sync commands in one place
# Source: Source this file to get convenient functions
# Usage: source git-commands.sh

# Main sync command - syncs everything
git_sync() {
    local msg="${1:-Update project}"
    ./git-sync.sh "$msg"
}

# Quick sync - same as git_sync but shorter
gsync() {
    git_sync "$@"
}

# Force sync database only (no git)
db_sync() {
    echo "🔄 Syncing database to Azure..."
    npm run db:push --force 2>/dev/null || npm run db:push
    FORCE_SYNC=true tsx server/sync-to-azure.ts
    echo "✅ Database synced"
}

# Quick status check
gstatus() {
    echo "📊 Repository Status:"
    echo ""
    git status
    echo ""
    echo "📋 Recent commits:"
    git log --oneline -5
}

# View schema changes
schema_diff() {
    echo "📋 Schema changes:"
    git diff shared/schema.ts
}

# Show available commands
show_commands() {
    echo ""
    echo "🎯 Available Git Sync Commands:"
    echo "================================"
    echo ""
    echo "git_sync \"message\"  - Sync code + database, commit and push"
    echo "gsync \"message\"     - Short version of git_sync"
    echo "db_sync            - Sync database only (no git)"
    echo "gstatus            - Show git status and recent commits"
    echo "schema_diff        - Show schema.ts changes"
    echo ""
    echo "Examples:"
    echo "  gsync \"Add user preferences\""
    echo "  db_sync"
    echo "  gstatus"
    echo ""
}

# Auto-show commands when sourced
show_commands
