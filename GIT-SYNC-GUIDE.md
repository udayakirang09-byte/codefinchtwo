# 🚀 Git Sync Commands - One Command Does Everything

## Quick Start

### One Command to Rule Them All

```bash
./git-sync.sh "Your commit message"
```

**This single command:**
1. ✅ Detects schema changes automatically
2. ✅ Syncs database to Azure (if needed)
3. ✅ Stages all changes (`git add .`)
4. ✅ Commits with your message
5. ✅ Pushes to remote repository

**Everything stays in sync automatically!**

---

## 📋 All Available Commands

### Primary Command

```bash
# Sync everything - code + database
./git-sync.sh "Add new feature"
```

### Helper Functions (Optional)

First, load the helper functions:
```bash
source git-commands.sh
```

Then use short commands:

| Command | What It Does |
|---------|-------------|
| `gsync "message"` | Same as git-sync.sh (shorter!) |
| `db_sync` | Sync database only (no git) |
| `gstatus` | Show git status + recent commits |
| `schema_diff` | Show schema.ts changes |

---

## 📖 Common Workflows

### Workflow 1: Regular Code Changes
```bash
# Make your changes
vim client/src/pages/HomePage.tsx

# Sync everything
./git-sync.sh "Update homepage design"

# ✅ Done! Code pushed, database synced if needed
```

### Workflow 2: Database Schema Changes
```bash
# Update schema
vim shared/schema.ts

# Sync everything (auto-detects schema change)
./git-sync.sh "Add user_preferences table"

# ✅ Done! Schema pushed to Neon, data synced to Azure, code pushed
```

### Workflow 3: Multiple Changes
```bash
# Make several changes across files
# ... edit files ...

# One command syncs it all
./git-sync.sh "Complete user profile feature"

# ✅ Done! Everything synced
```

### Workflow 4: Database Only Sync
```bash
# If you only need to sync database (no code changes)
source git-commands.sh
db_sync

# ✅ Done! Database synced to Azure
```

---

## 🔍 What Happens Under the Hood

When you run `./git-sync.sh "message"`:

```
1. Check for schema changes ────────┐
   ├─ Schema changed?               │
   │  ├─ Yes → Sync database        │  Automatic!
   │  └─ No → Skip sync             │
   └─────────────────────────────────┘
   
2. npm run db:push                  ← Push schema to Neon
3. FORCE_SYNC=true tsx sync script  ← Sync 62 tables to Azure
4. git add .                        ← Stage all changes
5. git commit -m "message"          ← Commit
6. git push                         ← Push to remote

✅ Everything in sync!
```

---

## 🎯 Daily Workflow Examples

### Morning: Start New Feature
```bash
# Create new branch (optional)
git checkout -b feature/new-feature

# Make changes
# ... code ...

# Sync when done
./git-sync.sh "WIP: New feature started"
```

### During Day: Incremental Updates
```bash
# Make changes
# ... code ...

# Quick sync
./git-sync.sh "Fix button styling"

# More changes
# ... code ...

# Quick sync again
./git-sync.sh "Add validation"
```

### End of Day: Final Sync
```bash
# Final changes
# ... code ...

# Final sync
./git-sync.sh "Complete feature implementation"

# Switch back to main
git checkout main
git merge feature/new-feature
git push
```

---

## 💡 Pro Tips

### 1. Use Helper Functions for Speed
```bash
# One-time setup (add to ~/.bashrc or ~/.zshrc)
echo "source $(pwd)/git-commands.sh" >> ~/.bashrc

# Now use anywhere:
gsync "Quick update"     # Instead of ./git-sync.sh
db_sync                  # Quick database sync
gstatus                  # Quick status check
```

### 2. Descriptive Commit Messages
```bash
# Good
./git-sync.sh "Add password reset functionality"
./git-sync.sh "Fix booking cancellation bug"

# Less helpful
./git-sync.sh "Update"
./git-sync.sh "Fix stuff"
```

### 3. Check Before Syncing
```bash
# See what changed
git status
git diff

# See schema changes specifically
source git-commands.sh
schema_diff

# Then sync
./git-sync.sh "Add email verification"
```

---

## 🔧 Customization

### Change Default Commit Message

Edit `git-sync.sh`, line 6:
```bash
COMMIT_MSG="${1:-Your default message here}"
```

### Skip Database Sync Force

If you want confirmation before force push, edit `git-sync.sh`, line 29:
```bash
npm run db:push  # Remove --force flag
```

### Add Auto-Formatting

Edit `git-sync.sh`, add before git add:
```bash
# Auto-format code
npm run format  # If you have a format script
```

---

## ❓ Troubleshooting

### "Nothing to commit"
This is normal - means no changes were made. Skip or make changes first.

### "Schema push failed"
```bash
# Use force push
npm run db:push --force
```

### "Git push failed"
```bash
# Pull changes first
git pull --rebase
./git-sync.sh "Your message"
```

### "Database sync failed"
```bash
# Check Azure credentials
echo $AZURE_POSTGRES_PASSWORD

# Retry manually
FORCE_SYNC=true tsx server/sync-to-azure.ts
```

---

## 📊 Command Comparison

| Task | Old Way | New Way |
|------|---------|---------|
| Code change | `git add .`<br>`git commit -m "msg"`<br>`git push` | `./git-sync.sh "msg"` |
| Schema change | `npm run db:push`<br>`FORCE_SYNC=true tsx ...`<br>`git add .`<br>`git commit`<br>`git push` | `./git-sync.sh "msg"` |
| DB only | `npm run db:push`<br>`FORCE_SYNC=true tsx ...` | `db_sync` |

**Result: ~90% fewer commands! 🎉**

---

## 🚀 Summary

### The Only Command You Need

```bash
./git-sync.sh "Your commit message"
```

**This handles:**
- ✅ Database schema changes
- ✅ Database data sync to Azure
- ✅ Git staging, commit, and push
- ✅ Everything stays in perfect sync

**No more manual steps. No more forgetting to sync. Just code and sync!**
