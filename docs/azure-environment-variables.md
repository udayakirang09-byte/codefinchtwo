# Azure App Service Environment Variables

Complete list of environment variables required for TechLearnOrbit platform deployment on Azure App Service.

---

## 🔴 Required Variables (Critical)

### Database
```
DATABASE_URL=postgresql://username:password@yourserver.postgres.database.azure.com:5432/techlearnorbit?sslmode=require
```
- **Description**: Azure PostgreSQL connection string
- **Format**: `postgresql://user:pass@host:5432/database?sslmode=require`
- **Where to get**: Azure Portal → PostgreSQL Server → Connection Strings

### Azure Storage (for recordings & media)
```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=yourname;AccountKey=yourkey;EndpointSuffix=core.windows.net
```
- **Description**: Azure Blob Storage for video recordings
- **Where to get**: Azure Portal → Storage Account → Access Keys

---

## 🟡 Required for Payment Processing

### Razorpay (Primary - India)
```
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_ADMINUPI=youradminupi@bank
```
- **Description**: Razorpay payment gateway credentials
- **Where to get**: Razorpay Dashboard → Settings → API Keys
- **Note**: Use `rzp_live_` for production, `rzp_test_` for testing

### Stripe (Secondary)
```
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_STRIPE_PUBLIC_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Description**: Stripe payment gateway credentials
- **Where to get**: Stripe Dashboard → Developers → API Keys
- **Note**: Webhook secret from Stripe Dashboard → Webhooks

---

## 🟢 Required for Email Notifications

### SendGrid
```
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Description**: Email service for OTP, notifications, password resets
- **Where to get**: SendGrid Dashboard → Settings → API Keys
- **Required scopes**: Mail Send (full access)

---

## 🔵 Required for WebRTC Video (99.99% Reliability)

### TURN Server (Self-hosted Azure)
```
VITE_TURN_SERVER_URL=turn:4.247.24.167:3478
VITE_TURN_USERNAME=techlearn
VITE_TURN_CREDENTIAL=YourSecurePasswordHere123!
```
- **Description**: Self-hosted TURN server for NAT traversal
- **Setup guide**: See `docs/azure-coturn-ui-setup-guide.md`
- **Note**: Already deployed at `4.247.24.167` if following setup guide
- **Privacy**: Self-hosted ensures student data stays in your infrastructure

---

## 🟣 Required for AI Features

### OpenAI (for AI help & analytics)
```
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Description**: AI-powered help and analytics
- **Where to get**: OpenAI Platform → API Keys

### Azure Content Safety
```
AZURE_CONTENT_SAFETY_ENDPOINT=https://yourname.cognitiveservices.azure.com/
AZURE_CONTENT_SAFETY_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Description**: Real-time content moderation for video sessions
- **Where to get**: Azure Portal → Content Safety → Keys and Endpoint

---

## 🟠 Optional (Performance & Caching)

### Redis (for caching)
```
REDIS_URL=redis://username:password@hostname:port
```
- **Description**: Session caching and performance optimization
- **Where to get**: Azure Cache for Redis → Access Keys
- **Note**: Platform works without Redis but with lower performance

---

## ⚙️ System Configuration (Auto-set by Azure)

### Node.js Environment
```
NODE_ENV=production
```
- **Description**: Tells the app to run in production mode
- **Value**: Always `production` for Azure App Service

### Server Port
```
PORT=3000
```
- **Description**: Port for the Express server
- **Value**: Use `3000` or let Azure auto-assign
- **Note**: Azure automatically maps this to port 80/443

---

## 🔧 Optional Domain/URL Variables

### Application URLs
```
REPLIT_DEV_DOMAIN=https://yourdomain.azurewebsites.net
REPLIT_DOMAINS=yourdomain.azurewebsites.net,www.yoursite.com
```
- **Description**: Your application's public URLs
- **Where to get**: Azure App Service → Overview → URL
- **Note**: Used for CORS, email links, and OAuth callbacks

---

## 📋 Testing/Staging Variables (Optional)

If you want to test payments before going live:

```
TESTING_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
TESTING_RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
TESTING_STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TESTING_VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🚀 How to Add Variables to Azure App Service

### Option 1: Azure Portal (Recommended)
1. Go to **Azure Portal** → **App Services** → **Your App**
2. Click **Configuration** in the left sidebar
3. Under **Application settings**, click **New application setting**
4. Add each variable:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://...`
5. Click **OK** → **Save** → **Continue** to restart

### Option 2: Azure CLI
```bash
# Set a single variable
az webapp config appsettings set \
  --name your-app-name \
  --resource-group your-resource-group \
  --settings DATABASE_URL="postgresql://..."

# Set multiple variables from file
az webapp config appsettings set \
  --name your-app-name \
  --resource-group your-resource-group \
  --settings @env-variables.json
```

---

## ✅ Quick Checklist

Before deploying to Azure, ensure you have:

**Critical (App won't start without these):**
- [ ] `DATABASE_URL` - Azure PostgreSQL connection
- [ ] `AZURE_STORAGE_CONNECTION_STRING` - Blob storage
- [ ] `SENDGRID_API_KEY` - Email service
- [ ] `NODE_ENV=production` - Production mode

**Payment Processing:**
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` - For Indian payments
- [ ] `STRIPE_SECRET_KEY` + `VITE_STRIPE_PUBLIC_KEY` - For card payments

**Video Conferencing (99.99% reliability):**
- [ ] `VITE_TURN_SERVER_URL` - Self-hosted TURN server
- [ ] `VITE_TURN_USERNAME` - TURN auth username
- [ ] `VITE_TURN_CREDENTIAL` - TURN auth password

**AI Features:**
- [ ] `OPENAI_API_KEY` - AI help & analytics
- [ ] `AZURE_CONTENT_SAFETY_ENDPOINT` + `AZURE_CONTENT_SAFETY_KEY` - Content moderation

---

## 🔒 Security Best Practices

1. **Never commit secrets to git** - Use Azure Key Vault or App Settings
2. **Use production keys in production** - No test keys in live environment
3. **Rotate credentials regularly** - Update API keys every 90 days
4. **Set Connection Security** - Always use `sslmode=require` for PostgreSQL
5. **Restrict CORS** - Set `REPLIT_DOMAINS` to your actual domains only

---

## 🧪 Testing Your Configuration

After setting variables in Azure:

1. **Restart your App Service**:
   ```bash
   az webapp restart --name your-app-name --resource-group your-resource-group
   ```

2. **Check logs**:
   ```bash
   az webapp log tail --name your-app-name --resource-group your-resource-group
   ```

3. **Verify endpoints**:
   - Health check: `https://yourapp.azurewebsites.net/api/admin/system-health`
   - Database: `https://yourapp.azurewebsites.net/api/mentors`

---

## 📞 Need Help?

**Missing a service?**
- **PostgreSQL**: Azure Portal → Create PostgreSQL Flexible Server
- **Blob Storage**: Azure Portal → Create Storage Account
- **TURN Server**: Follow `docs/azure-coturn-ui-setup-guide.md`
- **SendGrid**: Sign up at sendgrid.com (free tier: 100 emails/day)
- **Razorpay**: Sign up at razorpay.com
- **Stripe**: Sign up at stripe.com

**Common Issues:**
- "Cannot connect to database" → Check `DATABASE_URL` format and firewall rules
- "Payment failed" → Verify Razorpay/Stripe keys are production keys
- "Video won't connect" → Ensure TURN server is running (see TURN metrics dashboard)
- "Emails not sending" → Verify SendGrid API key has "Mail Send" permission

---

## 📊 Current Configuration Status

Based on your Replit secrets, you already have:
- ✅ `AZURE_CONTENT_SAFETY_ENDPOINT`
- ✅ `AZURE_CONTENT_SAFETY_KEY`
- ✅ `AZURE_POSTGRES_PASSWORD`
- ✅ `AZURE_STORAGE_CONNECTION_STRING`
- ✅ `RAZORPAY_ADMINUPI`
- ✅ `TESTING_RAZORPAY_KEY_ID`
- ✅ `TESTING_RAZORPAY_KEY_SECRET`
- ✅ `TESTING_STRIPE_SECRET_KEY`
- ✅ `TESTING_VITE_STRIPE_PUBLIC_KEY`

**Still need for production:**
- ⚠️ Production `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- ⚠️ Production `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`
- ⚠️ `SENDGRID_API_KEY`
- ⚠️ `OPENAI_API_KEY`
- ⚠️ `VITE_TURN_SERVER_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`

---

## 🎯 Summary

**Total variables needed: ~15-20**
- 🔴 Critical: 4 (Database, Storage, Email, Node env)
- 🟡 Payment: 5-7 (Razorpay + Stripe)
- 🔵 WebRTC: 3 (TURN server)
- 🟣 AI: 3 (OpenAI + Azure Content Safety)
- ⚙️ Optional: 1-2 (Redis, Domain URLs)

Your platform is **production-ready** once these are configured in Azure! 🚀
