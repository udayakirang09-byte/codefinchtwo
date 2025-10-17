# Redis Setup & Git/Database Sync Guide

## 🎯 **Step 1: Create Azure Managed Redis**

### Choose: **"Azure Managed Redis"** (First option in Services)

### Configuration:
```yaml
Name: codeconnect-redis
Subscription: <Your subscription>
Resource Group: <Same as App Service>
Location: <Same region as App Service>
Tier: Balanced (4:1 memory-to-vCPU ratio)
Capacity: 3 (6GB memory, ~$200-300/month)
High Availability: Enabled ✅
Clustering Policy: OSS cluster
Access Keys Authentication: Enabled
```

### After Creation:
1. Go to your Redis instance → **Settings** → **Access keys**
2. Copy **Primary connection string** (format: `redis://...`)
3. Add to App Service:
   ```bash
   # Azure Portal → App Service → Configuration → Application Settings
   Name: REDIS_URL
   Value: <paste connection string>
   ```

### Why Azure Managed Redis?
- ✅ **Future-proof**: Replaces retiring Azure Cache for Redis
- ✅ **Better performance**: 70% more throughput (multi-threaded)
- ✅ **Latest Redis 7.4+**: JSON, Search, TimeSeries modules
- ✅ **Cost-effective**: Best price/performance
- ✅ **99.99% availability** with high availability enabled

---

## 🔄 **Step 2: Git & Database Sync**

### **Option 1: One-Command Sync (Recommended)**

```bash
# Sync everything: database + code + push
./git-sync.sh "Your commit message"

# Examples:
./git-sync.sh "Add Redis caching optimization"
./git-sync.sh "Fix mentor discovery performance"
```

**What it does automatically:**
1. ✅ Detects schema changes in `shared/schema.ts`
2. ✅ Syncs database to Azure if schema changed
3. ✅ Stages all changes (`git add .`)
4. ✅ Commits with your message
5. ✅ Pushes to remote repository

---

### **Option 2: Quick Sync Shortcuts**

```bash
# Source the helper functions first:
source git-commands.sh

# Then use shortcuts:
gsync "commit message"     # Same as git-sync.sh (shorter!)
db_sync                    # Database sync only (no git)
gstatus                    # Show git status + recent commits
schema_diff                # View schema.ts changes
```

---

### **Option 3: Manual Step-by-Step**

```bash
# 1. Sync database to Azure (if schema changed)
npm run db:push --force
FORCE_SYNC=true tsx server/sync-to-azure.ts

# 2. Stage changes
git add .

# 3. Commit
git commit -m "Your message"

# 4. Push
git push
```

---

## 🚀 **Deployment Workflow**

### For Code-Only Changes:
```bash
./git-sync.sh "Update UI components"
# Auto-detects: No schema changes → Skips database sync
```

### For Database Schema Changes:
```bash
# Edit shared/schema.ts
./git-sync.sh "Add user preferences table"
# Auto-detects: Schema changed → Syncs database → Pushes code
```

### For Database Sync Only:
```bash
source git-commands.sh
db_sync
```

---

## 📋 **Pre-Deployment Checklist**

### Before Running git-sync:

✅ **Environment Variables Set:**
- [ ] `REDIS_URL` configured in Azure App Service
- [ ] `AZURE_POSTGRES_PASSWORD` for Azure PostgreSQL
- [ ] `AZURE_STORAGE_CONNECTION_STRING` for blob storage
- [ ] `UV_THREADPOOL_SIZE=32` for performance

✅ **Database Readiness:**
- [ ] Schema changes tested locally
- [ ] `npm run db:push` runs without errors
- [ ] No data loss warnings (or acknowledged)

✅ **Code Quality:**
- [ ] Application runs locally without errors
- [ ] Load tests passing (if performance-critical changes)

---

## 🔍 **Troubleshooting**

### Git sync fails:
```bash
# Check what changed:
git status

# View recent commits:
git log --oneline -5

# See schema changes:
git diff shared/schema.ts
```

### Database sync fails:
```bash
# Force push schema (careful - may lose data):
npm run db:push --force

# Check Azure PostgreSQL connection:
psql $DATABASE_URL -c "SELECT 1;"
```

### Redis connection fails:
```bash
# Test Redis URL format (should be redis:// or rediss://):
echo $REDIS_URL

# Verify in Azure Portal:
# Redis → Access keys → Copy Primary connection string
```

---

## 🎯 **Quick Reference**

| Command | What It Does |
|---------|--------------|
| `./git-sync.sh "msg"` | **Full sync:** DB + code + push |
| `source git-commands.sh` | Load shortcut functions |
| `gsync "msg"` | Same as git-sync (shorter) |
| `db_sync` | Database sync only |
| `gstatus` | Git status + recent commits |
| `schema_diff` | View schema changes |

---

## ⚡ **Pro Tips**

1. **Always use git-sync.sh** - It handles everything automatically
2. **Schema changes are auto-detected** - No manual checks needed
3. **Database syncs to both Neon + Azure** - Ensures consistency
4. **Force sync with caution** - Use `FORCE_SYNC=true` only when needed
5. **Test locally first** - Run `npm run dev` before syncing

---

## 📚 **Related Documentation**

- Full deployment guide: `AZURE_DEPLOYMENT.md`
- Performance results: `PERFORMANCE_TEST_RESULTS.md`
- Database sync script: `server/sync-to-azure.ts`
- Git hooks: `install-git-hook.sh` (automatic sync reminders)
