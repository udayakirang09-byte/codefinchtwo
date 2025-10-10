# 🚀 Quick Deployment Reference

## One-Command Deployment

```bash
./deploy.sh
```

This automated script:
- ✅ Detects schema changes
- ✅ Syncs database to Azure  
- ✅ Verifies everything is ready
- ✅ Provides deployment checklist

## Manual Steps (If Needed)

### If Schema Changed:
```bash
npm run db:push                              # Push to Neon
FORCE_SYNC=true tsx server/sync-to-azure.ts  # Sync to Azure
```

### If Code Only Changed:
```bash
git add .
git commit -m "message"
git push
```

## Install Git Hook (One-Time)

```bash
./install-git-hook.sh
```

This warns you automatically when committing schema changes.

## Emergency Commands

### Force Sync Database:
```bash
FORCE_SYNC=true tsx server/sync-to-azure.ts
```

### Check Schema Diff:
```bash
git diff shared/schema.ts
```

### Rollback Last Commit:
```bash
git revert HEAD
git push
```

---

📖 **Full Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed documentation
