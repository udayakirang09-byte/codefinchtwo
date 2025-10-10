# 🚀 Git Sync - Quick Commands

## The Only Command You Need

```bash
./git-sync.sh "Your commit message"
```

**This one command does EVERYTHING:**
- ✅ Detects schema changes automatically
- ✅ Syncs database to Azure (if needed)
- ✅ Stages all files (`git add .`)
- ✅ Commits with your message
- ✅ Pushes to remote repository

**Code and database always stay in perfect sync!**

---

## Examples

### Regular Development
```bash
# Make changes to your code
vim client/src/pages/Dashboard.tsx

# Sync everything
./git-sync.sh "Update dashboard UI"
# ✅ Done! Code pushed to git
```

### Schema Changes
```bash
# Update database schema
vim shared/schema.ts

# Sync everything (auto-detects and syncs database)
./git-sync.sh "Add user preferences table"
# ✅ Done! Schema pushed to Neon, data synced to Azure, code pushed to git
```

### Quick Updates
```bash
# Fix a bug
./git-sync.sh "Fix login button"

# Add a feature  
./git-sync.sh "Add password reset"

# Update styling
./git-sync.sh "Improve mobile layout"
```

---

## Optional: Helper Functions (For Even Faster Workflow)

### One-Time Setup
```bash
source git-commands.sh
```

### Then Use Short Commands
```bash
gsync "message"    # Same as ./git-sync.sh but shorter
db_sync            # Sync database only (no git)
gstatus            # Quick status check
schema_diff        # View schema changes
```

### Example Workflow
```bash
# Load helper functions
source git-commands.sh

# Use short commands
gsync "Add new feature"
db_sync
gstatus
```

---

## What Happens Behind the Scenes

```
./git-sync.sh "message"
    ↓
Check for schema.ts changes
    ↓
If changed:
  → npm run db:push (push to Neon)
  → FORCE_SYNC=true tsx server/sync-to-azure.ts (sync to Azure)
    ↓
git add .
    ↓
git commit -m "message"
    ↓
git push
    ↓
✅ Everything synced!
```

---

## Troubleshooting

### Problem: "Nothing to commit"
**Solution:** This is normal - no changes were made

### Problem: "Schema push failed"
**Solution:** 
```bash
npm run db:push --force
./git-sync.sh "Your message"
```

### Problem: "Git push rejected"
**Solution:**
```bash
git pull --rebase
./git-sync.sh "Your message"
```

---

## Summary

### Before (Old Way):
```bash
# Update schema
npm run db:push
FORCE_SYNC=true tsx server/sync-to-azure.ts
git add .
git commit -m "message"
git push
```
**5+ commands, easy to forget steps**

### After (New Way):
```bash
./git-sync.sh "message"
```
**1 command, automatic sync**

**That's 90% fewer commands and zero chance of forgetting to sync!** 🎉

---

📖 **Full Guide:** See [GIT-SYNC-GUIDE.md](./GIT-SYNC-GUIDE.md) for detailed documentation
