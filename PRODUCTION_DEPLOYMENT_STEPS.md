# Production Deployment Fix - Step-by-Step Guide

This document provides the complete solution for all 6 production issues on Azure.

---

## 📋 Issues Summary

| # | Issue | Root Cause | Status |
|---|-------|-----------|--------|
| 1 | Missing logo/images | Static assets deployment | 🔧 Fix below |
| 2 | TURN server alert | Missing VITE_ env vars | 🔧 Fix below |
| 3 | No mentors found | Database not synced | 🔧 Fix below |
| 4 | Email not triggered | Missing SENDGRID_API_KEY | 🔧 Fix below |
| 5 | Database sync needed | - | 🔧 Fix below |
| 6 | Git sync needed | - | 🔧 Fix below |

---

## ✅ STEP 1: Add Missing Azure Environment Variables

### Go to Azure Portal
1. Navigate to: **Azure Portal → Your App Service (kidzaimathapp30237)**
2. Click: **Settings → Environment variables**

### Add These Variables:

#### A. TURN Server Variables (Frontend)
```
VITE_TURN_SERVER_URL=<copy from VITE_TURN_SERVER_URL backend var>
VITE_TURN_USERNAME=<copy from VITE_TURN_USERNAME backend var>
VITE_TURN_CREDENTIAL=<copy from VITE_TURN_CREDENTIAL backend var>
```
**Note**: You already have these without `VITE_` prefix. You need BOTH versions because:
- Backend vars = Used by server code
- VITE_ vars = Embedded into frontend build at compile time

#### B. SendGrid Email
```
SENDGRID_API_KEY=<Get from Replit Secrets>
```
**Where to find**: In Replit, check your secrets panel or ask me to show you

#### C. Verify These Exist:
- ✅ DATABASE_URL (Azure PostgreSQL connection)
- ✅ AZURE_STORAGE_CONNECTION_STRING
- ✅ TESTING_RAZORPAY_KEY_ID
- ✅ TESTING_RAZORPAY_KEY_SECRET

### After Adding Variables:
1. Click **Apply** at bottom
2. Click **Confirm** when prompted
3. **Restart App Service** (Overview → Restart)

---

## ✅ STEP 2: Sync Database (Neon → Azure)

Run this command in Replit terminal:

```bash
# Option A: If you have DATABASE_URL_AZURE configured
FORCE_SYNC=true DATABASE_URL_AZURE="<your-azure-connection-string>" tsx server/sync-to-azure.ts

# Option B: If DATABASE_URL already points to Azure
FORCE_SYNC=true tsx server/sync-to-azure.ts
```

**What this does:**
- Exports all 62 tables from your Neon database
- Clears Azure PostgreSQL tables
- Imports all data to Azure
- Syncs mentors, time slots, teacher subjects, etc.

**Expected output:**
```
🔄 Starting complete Replit → Azure data sync...
📤 Exporting data from ALL 62 tables...
✅ Exported <number> total records from Neon
📊 Key tables exported:
   Users: <count>
   Mentors: <count>
   Time Slots: <count>
   Teacher Subjects: <count>
✅ Complete data sync successful!
```

**This fixes Issue #3** (No mentors found) because it copies:
- Teachers data
- Teacher subjects (class fees)
- Time slots (availability)

---

## ✅ STEP 3: Commit Code Changes to GitHub

Since git-sync.sh is blocked by Replit safety lock, run manually:

```bash
# 1. Stage all changes
git add .

# 2. Commit with message
git commit -m "Fix TypeScript errors in payment routes - Add null checks for Razorpay instance"

# 3. Push to GitHub
git push
```

**This triggers Azure deployment** which will:
- Rebuild the application with new VITE_ variables
- Fix TURN server alert (Issue #2)
- Deploy static assets correctly (Issue #1)

---

## ✅ STEP 4: Verify Deployment

### Wait for GitHub Actions Build
1. Go to: https://github.com/udayakirang09-byte/codefinchtwo/actions
2. Wait for latest workflow to complete (usually 3-5 minutes)
3. Verify: ✅ Build passes with 0 errors

### Check Azure Production

#### A. Verify Homepage Logo
- Visit: https://kidzaimathapp30237.azurewebsites.net
- Check: Logo appears in navbar
- Check: Achievement Unlocked image visible

#### B. Verify TURN Alert Gone
- Login as admin
- Go to Admin Dashboard
- Check: ⚠️ TURN server alert should be GONE

#### C. Verify Mentors Appear
- Go to: /mentors (Find Mentors page)
- Check: Teachers appear in list
- Verify: Shows teachers with subjects AND time slots configured

#### D. Verify Email Works
- Logout
- Login as teacher (udayaprm@gmail.com)
- Check email for OTP/2FA code
- Verify: Email received successfully

---

## 🔍 Troubleshooting

### If TURN Alert Still Shows:
**Problem**: VITE_ variables require rebuild
**Solution**: 
1. Make a trivial code change (add a comment somewhere)
2. Git commit and push again
3. This triggers fresh build with new variables

### If No Mentors Found:
**Problem**: Database sync incomplete or teachers missing data
**Solution**:
```bash
# Check which teachers are hidden and why
# In Replit, check server logs for:
⚠️ Teacher X hidden from Find Mentors - Missing: subjects / time slots
```

Then verify in Azure that teachers have:
1. At least one subject in `teacher_subjects` table
2. At least one time slot in `time_slots` table

### If Emails Not Triggered:
**Problem**: SENDGRID_API_KEY not configured correctly
**Solution**:
1. Verify key in Azure environment variables
2. Restart App Service
3. Check server logs for: `⚠️ SendGrid not configured`

---

## 📊 Summary Checklist

Before marking as complete, verify ALL:

- [ ] Azure Environment Variables added (VITE_TURN_*, SENDGRID_API_KEY)
- [ ] Database synced (Neon → Azure)
- [ ] Code committed and pushed to GitHub
- [ ] GitHub Actions build passes
- [ ] Azure App Service restarted
- [ ] Homepage logo appears
- [ ] TURN alert gone from admin dashboard
- [ ] Mentors appear in Find Mentors page
- [ ] Email triggered on login
- [ ] Test booking flow works end-to-end

---

## 🎯 Quick Commands Reference

```bash
# Database Sync
FORCE_SYNC=true tsx server/sync-to-azure.ts

# Git Sync (manual)
git add .
git commit -m "Your commit message"
git push

# Check TypeScript Errors
npm run typecheck

# Build Production
npm run build:production
```

---

## 📞 Need Help?

If any step fails, check:
1. Server logs in Azure (Log stream)
2. GitHub Actions build logs
3. Browser console (F12) for frontend errors
4. Database connection strings are correct

**All issues should be resolved after completing these steps!** ✨
