#!/bin/bash

# Install Git Pre-Commit Hook for Database Sync
# This hook checks for schema changes and reminds you to sync

echo ""
echo "🔧 Installing Git Pre-Commit Hook"
echo "=================================="
echo ""

# Create the pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check if schema.ts is being committed
if git diff --cached --name-only | grep -q "shared/schema.ts"; then
    echo ""
    echo "⚠️  DATABASE SCHEMA CHANGE DETECTED!"
    echo "===================================="
    echo ""
    echo "You're committing changes to shared/schema.ts"
    echo ""
    echo "📋 Required Actions:"
    echo "  1. Push schema to Neon: npm run db:push"
    echo "  2. Sync to Azure: FORCE_SYNC=true tsx server/sync-to-azure.ts"
    echo ""
    echo "💡 Or run the automated script: ./deploy.sh"
    echo ""
    
    read -p "Have you synced the database? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "❌ Commit cancelled. Please sync database first."
        echo ""
        echo "Quick sync command:"
        echo "  npm run db:push && FORCE_SYNC=true tsx server/sync-to-azure.ts"
        echo ""
        exit 1
    fi
    
    echo ""
    echo "✅ Proceeding with commit..."
    echo ""
fi

exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git pre-commit hook installed successfully!"
echo ""
echo "What this hook does:"
echo "  • Detects when you commit changes to shared/schema.ts"
echo "  • Reminds you to sync database to Azure"
echo "  • Asks for confirmation before proceeding"
echo ""
echo "To uninstall: rm .git/hooks/pre-commit"
echo ""
