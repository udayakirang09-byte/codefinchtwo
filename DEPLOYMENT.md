# CodeConnect Deployment Guide

This guide explains how to deploy CodeConnect with automated database synchronization.

## 🎯 Overview

CodeConnect uses a dual-database setup:
- **Development**: Neon PostgreSQL (Replit environment)
- **Production**: Azure PostgreSQL (deployed application)

When you modify the database schema, changes must be synced to both databases to maintain feature parity.

## 🚀 Deployment Workflow

### Option 1: Automated Deployment (Recommended)

Run the deployment script that handles everything:

```bash
./deploy.sh
```

This script will:
1. ✅ Check for schema changes in `shared/schema.ts`
2. ✅ Prompt you to commit uncommitted changes
3. ✅ Automatically sync database to Azure (if needed)
4. ✅ Provide deployment checklist

### Option 2: Manual Deployment

If you prefer manual control:

```bash
# 1. Check for schema changes
git diff shared/schema.ts

# 2. If schema changed, push to Neon
npm run db:push

# 3. Sync data to Azure
FORCE_SYNC=true tsx server/sync-to-azure.ts

# 4. Commit and push code
git add .
git commit -m "Your commit message"
git push

# 5. Deploy to Azure App Service
```

### Option 3: Git Hook (Automatic Reminders)

Install a pre-commit hook that reminds you to sync databases:

```bash
./install-git-hook.sh
```

After installation, every time you commit changes to `shared/schema.ts`, the hook will:
- ⚠️ Warn you about database schema changes
- 📋 Remind you to sync databases
- ❓ Ask for confirmation before proceeding

## 📋 Database Sync Process

### Understanding the Sync Script

The sync script (`server/sync-to-azure.ts`) handles **all 62 tables** with proper dependency ordering:

**Dependency Levels:**
- **Base**: Users, qualifications, admin configs (no dependencies)
- **Level 1**: Mentors, students, sessions (depend on users)
- **Level 2**: Courses, teacher data, payment methods (depend on Level 1)
- **Level 3**: Bookings, enrollments (depend on Level 2)
- **Level 4**: Chat, video, payments, reviews (depend on bookings)
- **Level 5**: Workflows, recordings, finances (deepest dependencies)

### Safety Features

1. **50-Record Threshold**: Warns if source database has <50 records (prevents accidental wipes)
2. **FORCE_SYNC Override**: Use `FORCE_SYNC=true` to bypass safety check for production deployment
3. **Foreign Key Safety**: Tables are deleted/inserted in correct order to avoid constraint violations

### Running Sync Manually

```bash
# Standard sync (with safety check)
tsx server/sync-to-azure.ts

# Force sync (bypass 50-record check)
FORCE_SYNC=true tsx server/sync-to-azure.ts
```

## 🔄 Common Scenarios

### Scenario 1: Added New Table/Column

```bash
# 1. Update shared/schema.ts with new table/column
# 2. Push schema to Neon
npm run db:push

# 3. Run deployment script
./deploy.sh

# 4. Follow prompts to sync to Azure
```

### Scenario 2: Modified Existing Table

```bash
# 1. Update shared/schema.ts
# 2. Push schema changes
npm run db:push --force  # Use --force if there's a data-loss warning

# 3. Sync to Azure
FORCE_SYNC=true tsx server/sync-to-azure.ts

# 4. Commit and deploy
git add .
git commit -m "Updated database schema"
git push
```

### Scenario 3: Code Changes Only (No DB Changes)

```bash
# No database sync needed
git add .
git commit -m "Fixed bug in UI"
git push
```

## ⚙️ Scripts Reference

### Deployment Scripts

| Script | Purpose |
|--------|---------|
| `./deploy.sh` | Automated deployment with DB sync verification |
| `./install-git-hook.sh` | Install pre-commit hook for DB reminders |
| `tsx server/verify-and-sync.ts` | Verify schema changes and sync databases |
| `tsx server/sync-to-azure.ts` | Manual database sync to Azure |

### NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run db:push` | Push schema changes to Neon database |
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |

## 🛡️ Best Practices

### 1. Always Test Locally First
- Test schema changes in development (Replit/Neon)
- Verify application works correctly
- Then sync to production (Azure)

### 2. Commit Schema Changes Separately
```bash
# Good practice: Commit schema changes separately
git add shared/schema.ts
git commit -m "Add user_preferences table"

# Then commit related code
git add .
git commit -m "Implement user preferences feature"
```

### 3. Backup Before Major Changes
```bash
# Before major schema changes, backup Azure database
# Use Azure Portal or pg_dump to create backup
```

### 4. Use the Automated Script
- The `./deploy.sh` script handles everything correctly
- Reduces human error
- Ensures databases stay in sync

## 🐛 Troubleshooting

### "Foreign key constraint violation" during sync

**Cause**: Tables being inserted in wrong order

**Solution**: The sync script now handles this automatically. If you still see this error:
```bash
# Check the error message for which table failed
# Verify dependency order in server/sync-to-azure.ts
```

### "Safety check: Source database appears empty"

**Cause**: Less than 50 records in development database

**Solution**: Use FORCE_SYNC to override:
```bash
FORCE_SYNC=true tsx server/sync-to-azure.ts
```

### Schema push fails with "Data loss warning"

**Cause**: Schema change would delete data (e.g., removing a column)

**Solution**: Use --force if data loss is acceptable:
```bash
npm run db:push --force
```

### Git hook not working

**Cause**: Hook not executable or not installed

**Solution**: Reinstall the hook:
```bash
./install-git-hook.sh
```

## 📊 Verification

After syncing, verify the deployment:

1. **Check record counts** (sync script shows this automatically):
   ```
   ✅ Sync completed: 1,234 records inserted
   ```

2. **Test production application**:
   - Login/signup works
   - Booking system functions
   - Payments process correctly
   - Video sessions connect
   - Chat messages load

3. **Check Azure database** (via Azure Portal or psql):
   ```bash
   # Connect to Azure PostgreSQL
   psql "postgresql://user@host/db?sslmode=require"
   
   # Verify table counts
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM bookings;
   ```

## 🚨 Emergency Rollback

If deployment causes issues:

1. **Revert code**:
   ```bash
   git revert HEAD
   git push
   ```

2. **Restore database** (if backed up):
   ```bash
   # Use Azure Portal to restore from backup
   # Or use pg_restore with your backup file
   ```

3. **Contact team** if issues persist

## 📝 Summary

**Before every deployment:**
1. ✅ Run `./deploy.sh` for automated sync
2. ✅ OR manually verify schema changes and sync
3. ✅ Test locally before pushing to production
4. ✅ Commit code and database changes together
5. ✅ Verify production after deployment

**Remember**: Code and database changes must stay in sync for the application to work correctly!
