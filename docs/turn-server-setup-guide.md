# TURN Server Setup Guide

**Last Updated:** 2025-10-23  
**Status:** 🟡 TEMPORARY FREE TIER (ExpressTURN)  
**Production Target:** 🎯 Azure Coturn (99.999% Reliability)

---

## 🚀 Quick Start: ExpressTURN Free Tier (5 minutes)

### Step 1: Create ExpressTURN Account

1. **Visit ExpressTURN**  
   Go to: https://www.expressturn.com/

2. **Sign Up for Free Plan**
   - Click "Get Started" or "Sign Up"
   - Choose **Free Plan**: 1000 GB/month bandwidth
   - Enter your email address
   - Create a password
   - Verify your email

3. **Get Your Credentials**
   After signup, you'll receive:
   ```
   TURN Server URL: turn:a.relay.expressturn.com:3478
   Username: your_username_here
   Credential: your_password_here
   ```

4. **Alternative: Cloudflare Calls** (if you prefer)
   - Signup at: https://www.cloudflare.com/products/calls/
   - Free tier: 1 TB/month (more generous)
   - Follow their setup wizard to get credentials

### Step 2: Add Credentials to Replit

Once you have your TURN credentials:

1. Open your Replit project
2. Go to **Secrets** (lock icon in left sidebar)
3. Add these secrets:
   ```
   TURN_SERVER_URL=turn:a.relay.expressturn.com:3478
   TURN_USERNAME=your_username_here
   TURN_CREDENTIAL=your_password_here
   ```

### Step 3: Verify Integration

The application will automatically use these credentials. Check:
1. Join a video class
2. Open browser DevTools → Console
3. Look for: `🔗 ICE Servers configured with TURN relay`
4. Dashboard will show connection type (P2P vs TURN relay)

---

## ⚠️ FREE TIER LIMITATIONS

**ExpressTURN Free Tier:**
- ✅ 1000 GB/month bandwidth
- ✅ TCP/UDP on port 3478
- ❌ No port 80/443 (premium only)
- ❌ No SLA guarantee
- ❌ Shared infrastructure
- ❌ Not suitable for production at scale

**For 99.999% Reliability:**
- Must migrate to **Azure Coturn** (self-hosted)
- See production setup guide below

---

## 🎯 Production Setup: Azure Coturn (99.999% SLA)

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│         TechLearnOrbit Platform             │
│  (Azure App Service - Central India)        │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌───────▼────────┐
│  TURN Server 1 │  │  TURN Server 2 │
│ Central India  │  │  South India   │
│ (Primary)      │  │  (Backup)      │
│                │  │                │
│ Coturn 4.6.3   │  │ Coturn 4.6.3   │
│ UDP: 3478-3479 │  │ UDP: 3478-3479 │
│ TCP: 443       │  │ TCP: 443       │
│ TLS: 5349      │  │ TLS: 5349      │
└────────────────┘  └────────────────┘
     99.99%             99.99%
```

### Step 1: Provision Azure Resources

#### 1.1 Create Virtual Machines

**For TURN Server 1 (Primary - Central India):**

```bash
# Azure CLI commands
az vm create \
  --resource-group TechLearnOrbit-RG \
  --name TLO-TURN-Central \
  --location centralindia \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username turnuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --nsg-rule SSH

# Note the public IP address
az vm show -d \
  --resource-group TechLearnOrbit-RG \
  --name TLO-TURN-Central \
  --query publicIps -o tsv
```

**Repeat for TURN Server 2 (Backup - South India):**
```bash
az vm create \
  --resource-group TechLearnOrbit-RG \
  --name TLO-TURN-South \
  --location southindia \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username turnuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --nsg-rule SSH
```

**VM Sizing Guide:**
- **Standard_B2s**: 2 vCPUs, 4 GB RAM (~$40/month)
  - Good for: 50-100 concurrent sessions
- **Standard_B4ms**: 4 vCPUs, 16 GB RAM (~$140/month)
  - Good for: 200-400 concurrent sessions
- **Standard_D8s_v3**: 8 vCPUs, 32 GB RAM (~$280/month)
  - Good for: 500-1000 concurrent sessions

#### 1.2 Configure Network Security Groups

```bash
# Allow TURN ports
az network nsg rule create \
  --resource-group TechLearnOrbit-RG \
  --nsg-name TLO-TURN-Central-nsg \
  --name Allow-TURN-UDP \
  --priority 1000 \
  --direction Inbound \
  --access Allow \
  --protocol Udp \
  --source-address-prefixes '*' \
  --source-port-ranges '*' \
  --destination-port-ranges 3478-3479 49152-65535

az network nsg rule create \
  --resource-group TechLearnOrbit-RG \
  --nsg-name TLO-TURN-Central-nsg \
  --name Allow-TURN-TCP \
  --priority 1001 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes '*' \
  --source-port-ranges '*' \
  --destination-port-ranges 443 5349

# Repeat for South India NSG
```

### Step 2: Install Coturn

SSH into each VM and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Coturn
sudo apt install coturn -y

# Enable Coturn service
sudo nano /etc/default/coturn
# Uncomment: TURNSERVER_ENABLED=1

# Generate static auth secret
TURN_SECRET=$(openssl rand -hex 32)
echo "Save this secret: $TURN_SECRET"
```

### Step 3: Configure Coturn

Edit `/etc/turnserver.conf`:

```bash
sudo nano /etc/turnserver.conf
```

**Basic Configuration:**
```conf
# Listener IP (use your VM's private IP)
listening-ip=10.0.0.4
relay-ip=10.0.0.4

# External IP (your VM's public IP)
external-ip=YOUR_PUBLIC_IP/10.0.0.4

# Listener ports
listening-port=3478
tls-listening-port=5349
alt-listening-port=3479
alt-tls-listening-port=5350

# Relay ports range
min-port=49152
max-port=65535

# Enable fingerprints in TURN messages
fingerprint

# Long-term credentials mechanism
lt-cred-mech

# Static authentication secret
use-auth-secret
static-auth-secret=YOUR_GENERATED_SECRET_HERE

# Realm (your domain)
realm=turn.techlearnorbit.com

# SSL/TLS certificates (Let's Encrypt)
cert=/etc/letsencrypt/live/turn.techlearnorbit.com/cert.pem
pkey=/etc/letsencrypt/live/turn.techlearnorbit.com/privkey.pem

# Logging
log-file=/var/log/turnserver/turnserver.log
verbose

# Security
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1

# Banned peers (optional)
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255

# Performance tuning
max-bps=1000000
bps-capacity=0
stale-nonce=600
```

### Step 4: SSL Certificates (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot -y

# Create DNS A record first:
# turn.techlearnorbit.com → YOUR_PUBLIC_IP

# Get certificate
sudo certbot certonly --standalone \
  -d turn.techlearnorbit.com \
  --agree-tos \
  --email admin@techlearnorbit.com

# Auto-renewal cron job
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet && systemctl restart coturn
```

### Step 5: Start and Monitor Coturn

```bash
# Start Coturn
sudo systemctl start coturn
sudo systemctl enable coturn

# Check status
sudo systemctl status coturn

# Monitor logs
sudo tail -f /var/log/turnserver/turnserver.log

# Test TURN server
turnutils_uclient -v -u test -w test YOUR_PUBLIC_IP
```

### Step 6: DNS Configuration

Create DNS records:

```
turn1.techlearnorbit.com  A     CENTRAL_INDIA_IP
turn2.techlearnorbit.com  A     SOUTH_INDIA_IP
turn.techlearnorbit.com   A     CENTRAL_INDIA_IP
turn.techlearnorbit.com   A     SOUTH_INDIA_IP  (multi-A record)
```

### Step 7: Update Application Configuration

Add to Replit Secrets:

```
TURN_SERVER_1_URL=turn:turn1.techlearnorbit.com:3478
TURN_SERVER_2_URL=turn:turn2.techlearnorbit.com:3478
TURN_STATIC_SECRET=your_generated_secret_here
TURN_REALM=turn.techlearnorbit.com
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check if Coturn is running
systemctl status coturn

# Check listening ports
sudo netstat -tulpn | grep turnserver

# Check active sessions
sudo turnutils_uclient -v YOUR_PUBLIC_IP
```

### Performance Monitoring

```bash
# Install monitoring tools
sudo apt install htop iftop nethogs -y

# Monitor CPU/RAM
htop

# Monitor network bandwidth
sudo iftop -i eth0

# Monitor connections
watch -n 1 'netstat -an | grep 3478 | wc -l'
```

### Azure Monitor Integration

1. Enable **Azure Monitor** for VMs
2. Create alerts for:
   - CPU > 80% for 5 minutes
   - Memory > 90%
   - Network bandwidth > 800 Mbps
   - VM offline/unreachable

### Cost Optimization

**Monthly Cost Estimate:**
- VM (Standard_B2s): $40 × 2 = $80
- Bandwidth (150 GB): ~$12
- Public IP: $3.60 × 2 = $7.20
- **Total: ~$100/month**

**Scaling Strategy:**
- Start with B2s VMs
- Monitor usage metrics
- Upgrade to B4ms when >70% CPU consistently
- Add more regions (East India, West India) as user base grows

---

## 🔒 Security Best Practices

### DDoS Protection

1. **Azure DDoS Protection Standard**
   ```bash
   az network ddos-protection create \
     --resource-group TechLearnOrbit-RG \
     --name TLO-DDoS-Protection \
     --location centralindia
   ```

2. **Rate Limiting in Coturn**
   ```conf
   # In /etc/turnserver.conf
   max-bps=1000000
   bps-capacity=0
   max-allocate-lifetime=3600
   ```

### Firewall Rules

```bash
# Install UFW
sudo apt install ufw -y

# Allow only necessary ports
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 3478:3479/udp # TURN UDP
sudo ufw allow 443/tcp       # TURN TCP
sudo ufw allow 5349/tcp      # TURN TLS
sudo ufw allow 49152:65535/udp # RTP relay

sudo ufw enable
```

### Authentication

Always use **static-auth-secret** instead of hardcoded credentials:

```javascript
// Generate time-limited credentials (server-side)
const crypto = require('crypto');

function generateTurnCredentials(username, secret, ttl = 86400) {
  const unixTimestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${unixTimestamp}:${username}`;
  const turnPassword = crypto
    .createHmac('sha1', secret)
    .update(turnUsername)
    .digest('base64');
  
  return { username: turnUsername, password: turnPassword };
}
```

---

## 📈 Migration Checklist

### Phase 1: ExpressTURN (Current - Week 1)
- [x] Create ExpressTURN account
- [ ] Add credentials to Replit Secrets
- [ ] Test TURN connectivity
- [ ] Monitor relay usage %
- [ ] Add dashboard warning banner

### Phase 2: Azure Preparation (Week 2-3)
- [ ] Provision Azure VMs (Central + South India)
- [ ] Install and configure Coturn
- [ ] Set up SSL certificates
- [ ] Configure DNS records
- [ ] Run connectivity tests

### Phase 3: Parallel Testing (Week 3)
- [ ] Add Azure TURN servers to ICE config (alongside ExpressTURN)
- [ ] A/B test reliability metrics
- [ ] Monitor cost vs performance
- [ ] Compare P2P vs TURN % for both

### Phase 4: Production Cutover (Week 4)
- [ ] Remove ExpressTURN from ICE servers
- [ ] Switch to Azure TURN exclusively
- [ ] Update dashboard to show multi-region health
- [ ] Remove warning banner
- [ ] Monitor for 7 days

### Phase 5: Optimization (Week 5+)
- [ ] Add third region (East/West India) if needed
- [ ] Implement auto-scaling policies
- [ ] Set up Azure Monitor alerts
- [ ] Document runbook for incidents

---

## 🆘 Troubleshooting

### Common Issues

**1. Coturn won't start**
```bash
# Check logs
sudo journalctl -u coturn -n 50

# Check config syntax
turnserver -c /etc/turnserver.conf --check-config
```

**2. TURN not working (always P2P)**
```bash
# Test TURN connectivity
turnutils_uclient -v -u test -w test YOUR_PUBLIC_IP

# Check firewall
sudo ufw status
sudo iptables -L -n
```

**3. High CPU usage**
```bash
# Check active sessions
sudo lsof -i :3478

# Restart Coturn
sudo systemctl restart coturn
```

**4. SSL certificate issues**
```bash
# Verify certificate
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

---

## 📚 Additional Resources

- **Coturn Documentation**: https://github.com/coturn/coturn/wiki
- **Azure VM Pricing**: https://azure.microsoft.com/en-us/pricing/details/virtual-machines/
- **Let's Encrypt**: https://letsencrypt.org/
- **WebRTC Best Practices**: https://webrtc.org/getting-started/turn-server

---

## 🎯 Success Metrics (99.999% SLA)

**Target KPIs:**
- TURN server uptime: **99.999%** (26 seconds downtime/month)
- Connection success rate: **>99.5%** (TURN fallback working)
- P2P vs TURN ratio: **70% P2P, 30% TURN** (healthy mix)
- Average connection time: **<2 seconds**
- Failover time: **<5 seconds** (region switch)

**Dashboard Monitoring:**
- Real-time TURN health status (green/amber/red)
- Region-wise connection distribution
- Bandwidth usage trends
- Cost tracking vs free tier comparison
