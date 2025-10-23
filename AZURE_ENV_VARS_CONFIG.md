# Azure App Service Environment Variables Configuration

This document lists ALL environment variables needed for TechLearnOrbit production deployment on Azure.

## ✅ Required Environment Variables

### 1. Database Configuration
```
DATABASE_URL=<Your Azure PostgreSQL connection string>
```
Example: `postgresql://username:password@servername.postgres.database.azure.com:5432/database?sslmode=require`

### 2. Email Configuration (SendGrid)
```
SENDGRID_API_KEY=<Your SendGrid API key>
```
- **Status**: ✅ Available in Replit secrets
- **Purpose**: Required for login OTP, password reset, 2FA emails

### 3. TURN Server Configuration (WebRTC)

**CRITICAL**: Azure App Service environment variables are backend-only. For frontend Vite variables, you must add them with `VITE_` prefix.

#### Backend TURN Variables (Already configured):
```
VITE_TURN_CREDENTIAL=<Your TURN password>
VITE_TURN_SERVER_URL=<Your TURN server URL>
VITE_TURN_USERNAME=<Your TURN username>
```

#### Frontend TURN Variables (MISSING - Add these):
```
VITE_TURN_CREDENTIAL=<Same as backend>
VITE_TURN_SERVER_URL=<Same as backend>  
VITE_TURN_USERNAME=<Same as backend>
```

**Why**: Vite replaces `import.meta.env.VITE_*` variables at **build time**, not runtime. The alert is checking `import.meta.env.VITE_TURN_SERVER_URL`.

### 4. Payment Gateway Configuration

#### Razorpay (Testing):
```
TESTING_RAZORPAY_KEY_ID=<Your test key ID>
TESTING_RAZORPAY_KEY_SECRET=<Your test key secret>
RAZORPAY_ADMINUPI=<Admin UPI for payouts>
```

#### Stripe (Testing):
```
TESTING_STRIPE_SECRET_KEY=<Your test secret key>
TESTING_VITE_STRIPE_PUBLIC_KEY=<Your test public key>
VITE_STRIPE_PUBLIC_KEY=<Your test public key>
```

### 5. Azure Storage (Recordings)
```
AZURE_STORAGE_CONNECTION_STRING=<Your Azure Storage connection string>
AZURE_CONTENT_SAFETY_ENDPOINT=<Your Content Safety endpoint>
AZURE_CONTENT_SAFETY_KEY=<Your Content Safety key>
```

### 6. Node Environment
```
NODE_ENV=production
```

## 🔧 How to Add Variables in Azure Portal

1. Go to Azure Portal → Your App Service
2. Settings → **Environment variables**
3. Click **+ Add** for each variable
4. **Important**: After adding VITE_ variables, you must **rebuild and redeploy** the application

## 🚨 Current Missing Variables (Based on Alert)

### Issue 2: TURN Server Alert
**Problem**: VITE_TURN_SERVER_URL not available in frontend build
**Solution**: 
1. Add to Azure environment variables with exact same values as backend
2. Rebuild application with `npm run build` (GitHub Actions will do this automatically)
3. Redeploy

### Issue 4: Email Not Triggered
**Problem**: SENDGRID_API_KEY not configured in Azure
**Solution**: 
1. Copy value from Replit secret: `SENDGRID_API_KEY`
2. Add to Azure environment variables
3. Restart App Service

## 📋 Verification Checklist

- [ ] DATABASE_URL points to Azure PostgreSQL
- [ ] SENDGRID_API_KEY configured
- [ ] VITE_TURN_* variables added (both backend and VITE_ prefixed)
- [ ] Payment gateway keys configured
- [ ] Azure Storage connection string configured
- [ ] NODE_ENV=production set
- [ ] Application rebuilt after adding VITE_ variables
- [ ] App Service restarted after configuration changes

## 🔄 After Configuration

1. Restart Azure App Service
2. For VITE_ variables: Trigger new deployment (git push) to rebuild with new variables
3. Verify alerts disappear in admin dashboard
