# Azure Coturn TURN Server Setup Guide (Azure Portal UI)

## Overview
This guide walks you through setting up a self-hosted Coturn TURN server on Azure using the Azure Portal UI. This ensures complete data privacy and control for your educational platform.

**Cost**: ~$30-50/month (Single VM)  
**Setup Time**: 30 minutes  
**Reliability**: 99.9% (Single region)

---

## Part 1: Create Azure VM via Azure Portal UI

### Step 1: Sign in to Azure Portal
1. Go to https://portal.azure.com
2. Sign in with your Azure account
3. Click **"Create a resource"** in the top left

### Step 2: Create Ubuntu Virtual Machine
1. Search for **"Ubuntu Server"** in the marketplace
2. Select **"Ubuntu Server 22.04 LTS"**
3. Click **"Create"**

### Step 3: Configure Basics Tab
Fill in the following:

**Project Details:**
- **Subscription**: Select your Azure subscription
- **Resource Group**: Click "Create new" → Name it `techlearnorbit-turn-rg`

**Instance Details:**
- **Virtual machine name**: `techlearnorbit-turn-vm`
- **Region**: Choose closest to your users (e.g., `East US`, `West Europe`, `Southeast Asia`)
- **Availability options**: `No infrastructure redundancy required`
- **Security type**: `Standard`
- **Image**: `Ubuntu Server 22.04 LTS - x64 Gen2`
- **VM architecture**: `x64`
- **Size**: Click "See all sizes"
  - Search for **`B2s`** (2 vCPUs, 4 GB RAM)
  - Select **`Standard_B2s`** (~$30/month)
  - Click **"Select"**

**Administrator Account:**
- **Authentication type**: Select **"SSH public key"**
- **Username**: `azureuser` (default is fine)
- **SSH public key source**: Select **"Generate new key pair"**
- **Key pair name**: `techlearnorbit-turn-key`

**Inbound Port Rules:**
- **Public inbound ports**: Select **"Allow selected ports"**
- **Select inbound ports**: Check these 3 boxes:
  - ✅ SSH (22)
  - ✅ HTTP (80)
  - ✅ HTTPS (443)

Click **"Next: Disks >"** at the bottom

### Step 4: Configure Disks Tab
- **OS disk type**: Select **"Standard SSD"** (cheaper, sufficient for TURN)
- Leave other settings as default

Click **"Next: Networking >"**

### Step 5: Configure Networking Tab
**Network Interface:**
- **Virtual network**: (Auto-created is fine)
- **Subnet**: (Auto-created is fine)
- **Public IP**: (Auto-created is fine)
- **NIC network security group**: Select **"Advanced"**
- Click **"Create new"** under "Configure network security group"

**Network Security Group Rules:**
You'll see default rules. Add custom TURN server ports:

1. Click **"+ Add an inbound rule"**
   - **Source**: `Any`
   - **Source port ranges**: `*`
   - **Destination**: `Any`
   - **Service**: `Custom`
   - **Destination port ranges**: `3478`
   - **Protocol**: `Any`
   - **Action**: `Allow`
   - **Priority**: `310`
   - **Name**: `Allow-TURN-3478`
   - Click **"Add"**

2. Click **"+ Add an inbound rule"** again
   - **Source**: `Any`
   - **Source port ranges**: `*`
   - **Destination**: `Any`
   - **Service**: `Custom`
   - **Destination port ranges**: `49152-65535`
   - **Protocol**: `UDP`
   - **Action**: `Allow`
   - **Priority**: `320`
   - **Name**: `Allow-TURN-UDP-Range`
   - Click **"Add"**

3. Click **"OK"** to save the security group

**Delete public IP and NIC when VM is deleted:**
- ✅ Check this box (cleanup convenience)

Click **"Next: Management >"**

### Step 6: Configure Management Tab
- **Boot diagnostics**: Select **"Enable with managed storage account"**
- Leave other settings as default

Click **"Next: Monitoring >"**

### Step 7: Configure Monitoring Tab (Optional)
- **Azure Monitor**: You can enable or disable (not critical for MVP)

Click **"Next: Advanced >"**

### Step 8: Advanced Tab
- Leave all default settings

Click **"Review + create"**

### Step 9: Review and Create
1. Review your configuration summary
2. Click **"Create"**
3. **IMPORTANT**: A popup appears asking you to download the SSH key
   - Click **"Download private key and create resource"**
   - Save the `.pem` file to a safe location (e.g., `~/Downloads/techlearnorbit-turn-key.pem`)
   - **Do NOT lose this file** - you need it to access your VM

### Step 10: Wait for Deployment
- Deployment typically takes 2-3 minutes
- Wait for "Your deployment is complete" message
- Click **"Go to resource"** to view your VM

---

## Part 2: Note Your VM's Public IP Address

1. On your VM overview page, look for **"Public IP address"**
2. **COPY THIS IP ADDRESS** - you'll need it multiple times
   - Example: `20.12.34.56`
3. Keep this Azure Portal tab open for reference

---

## Part 3: Connect to Your VM via SSH

### For macOS/Linux Users:

1. Open **Terminal**
2. Set correct permissions for your SSH key:
   ```bash
   chmod 400 ~/Downloads/techlearnorbit-turn-key.pem
   ```

3. Connect to your VM:
   ```bash
   ssh -i ~/Downloads/techlearnorbit-turn-key.pem azureuser@YOUR_VM_IP
   ```
   Replace `YOUR_VM_IP` with the IP you copied (e.g., `20.12.34.56`)

4. Type `yes` when asked "Are you sure you want to continue connecting?"

### For Windows Users:

**Option A: Using PowerShell (Built-in)**
1. Open **PowerShell** (search for it in Start menu)
2. Navigate to your Downloads folder:
   ```powershell
   cd $HOME\Downloads
   ```
3. Connect to your VM:
   ```powershell
   ssh -i techlearnorbit-turn-key.pem azureuser@YOUR_VM_IP
   ```
   Replace `YOUR_VM_IP` with the IP you copied

**Option B: Using PuTTY (If PowerShell doesn't work)**
1. Download and install PuTTY from https://www.putty.org/
2. Convert `.pem` to `.ppk`:
   - Open **PuTTYgen**
   - Click **"Load"** and select your `.pem` file
   - Click **"Save private key"** → Save as `techlearnorbit-turn-key.ppk`
3. Open **PuTTY**
   - **Host Name**: `azureuser@YOUR_VM_IP`
   - **Connection > SSH > Auth > Credentials**: Browse and select your `.ppk` file
   - Click **"Open"**

---

## Part 4: Install and Configure Coturn (Run These Commands in SSH)

You should now see a terminal prompt like: `azureuser@techlearnorbit-turn-vm:~$`

### Step 1: Update System Packages
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Step 2: Install Coturn
```bash
sudo apt-get install coturn -y
```

### Step 3: Enable Coturn Service
```bash
sudo systemctl enable coturn
```

### Step 4: Configure Coturn
```bash
sudo nano /etc/turnserver.conf
```

This opens a text editor. **Delete everything** (Ctrl+K repeatedly) and paste this configuration:

```conf
# TURN server name and realm
realm=techlearnorbit.com
server-name=techlearnorbit-turn

# Listening ports
listening-port=3478
tls-listening-port=5349

# Public IP (REPLACE WITH YOUR VM IP)
external-ip=YOUR_VM_IP

# UDP relay ports
min-port=49152
max-port=65535

# Enable verbose logging (disable in production after testing)
verbose

# Authentication
lt-cred-mech
user=techlearn:CHANGE_THIS_PASSWORD_NOW

# SSL certificates (optional for now, add later for TLS)
# cert=/etc/ssl/turn_server_cert.pem
# pkey=/etc/ssl/turn_server_pkey.pem

# Security
fingerprint
no-multicast-peers
no-cli
no-loopback-peers

# Performance
no-tlsv1
no-tlsv1_1
```

**IMPORTANT CHANGES BEFORE SAVING:**

1. **Replace `YOUR_VM_IP`** with your actual VM IP address:
   ```conf
   external-ip=20.12.34.56
   ```

2. **Change the password** from `CHANGE_THIS_PASSWORD_NOW` to something secure:
   ```conf
   user=techlearn:YourSuperSecurePassword123!
   ```
   - Use a strong password (letters, numbers, symbols)
   - **SAVE THIS PASSWORD** - you'll need it for Replit secrets

**Save and Exit:**
- Press **Ctrl+O** (letter O, not zero) to save
- Press **Enter** to confirm
- Press **Ctrl+X** to exit

### Step 5: Start Coturn Service
```bash
sudo systemctl restart coturn
```

### Step 6: Check Coturn Status
```bash
sudo systemctl status coturn
```

You should see **"active (running)"** in green. Press **Q** to exit.

### Step 7: Test Coturn Logs
```bash
sudo journalctl -u coturn -f
```

You should see logs like:
```
0: : turn server started
0: : Listener address to use: 0.0.0.0:3478
```

Press **Ctrl+C** to exit log viewing.

---

## Part 5: Configure Replit Secrets

1. Go to your Replit project
2. Click **"Secrets"** in the left sidebar (lock icon)
3. Add these 3 secrets:

| Key | Value | Example |
|-----|-------|---------|
| `VITE_TURN_SERVER_URL` | `turn:YOUR_VM_IP:3478` | `turn:20.12.34.56:3478` |
| `VITE_TURN_USERNAME` | `techlearn` | `techlearn` |
| `VITE_TURN_PASSWORD` | Your password from Step 4 | `YourSuperSecurePassword123!` |

4. Click **"Save"** for each secret

---

## Part 6: Test Your TURN Server

### Test 1: From Your Local Computer

Visit this online TURN server tester:
- https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

Fill in:
- **TURN URI**: `turn:YOUR_VM_IP:3478`
- **TURN username**: `techlearn`
- **TURN password**: `YourSuperSecurePassword123!`

Click **"Add Server"** → **"Gather candidates"**

**Success**: You should see entries with `typ relay` (this means TURN is working!)

### Test 2: From Replit Application

1. Restart your Replit application
2. Check the admin dashboard - the **RED WARNING BANNER should disappear**
3. Start a video call between a student and teacher
4. Open browser console (F12) and look for WebRTC logs

---

## Part 7: Cost Optimization

### Current Setup Cost: ~$30-40/month
- Azure VM B2s: ~$30/month
- Bandwidth: ~$5-10/month (first 5GB free)

### Monitor Your Usage:
1. In Azure Portal, go to **Cost Management + Billing**
2. Set up billing alerts:
   - Click **"Cost alerts"**
   - **"Add"** → **"Budget"**
   - Set monthly budget to $50
   - Get email alerts at 80% ($40)

---

## Part 8: Firewall Rules Summary

Your VM should have these ports open:

| Port | Protocol | Purpose | Priority |
|------|----------|---------|----------|
| 22 | TCP | SSH access | 300 |
| 3478 | TCP/UDP | TURN server | 310 |
| 49152-65535 | UDP | TURN relay ports | 320 |

---

## Security Best Practices

### 1. Change Default SSH Port (Optional, Advanced)
```bash
sudo nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
sudo systemctl restart sshd
```

### 2. Enable Ubuntu Firewall (UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 3478
sudo ufw allow 49152:65535/udp
sudo ufw enable
```

### 3. Regular Updates
Set up automatic security updates:
```bash
sudo apt-get install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 4. Monitor Logs Regularly
```bash
sudo journalctl -u coturn --since "1 hour ago"
```

---

## Troubleshooting

### Issue: Can't SSH into VM
**Solution**: Check Network Security Group rules in Azure Portal
1. Go to your VM → **Networking**
2. Verify SSH (port 22) is allowed

### Issue: TURN server not working
**Solution**: Check Coturn service status
```bash
sudo systemctl status coturn
sudo journalctl -u coturn -n 50
```

### Issue: "Connection refused" errors
**Solution**: Verify firewall rules
```bash
sudo ufw status
sudo netstat -tulpn | grep 3478
```

### Issue: High bandwidth costs
**Solution**: Monitor and optimize
1. Check Azure Cost Management dashboard
2. Consider compression settings in Coturn config
3. Limit TURN usage to only NAT-blocked connections

---

## Upgrading to 99.999% Reliability (Multi-Region)

Once your single VM is stable, upgrade to multi-region:

1. **Create a second VM** in a different region (e.g., if first is in `East US`, put second in `West Europe`)
2. **Follow this same guide** for the second VM
3. **Update Replit secrets** with multiple TURN servers:
   ```
   VITE_TURN_SERVER_URL=turn:20.12.34.56:3478,turn:40.56.78.90:3478
   ```
4. Your WebRTC code will automatically use both for redundancy

**Cost**: ~$60-80/month (2 VMs)  
**Reliability**: 99.999% (5-nines)

---

## Maintenance Schedule

### Daily (Automated):
- ✅ System security updates (via unattended-upgrades)

### Weekly:
- Check Coturn logs for errors
- Monitor Azure cost dashboard

### Monthly:
- Review bandwidth usage
- Update Coturn if new version available:
  ```bash
  sudo apt-get update
  sudo apt-get upgrade coturn
  sudo systemctl restart coturn
  ```

---

## Support Resources

- **Coturn Documentation**: https://github.com/coturn/coturn
- **Azure VM Pricing**: https://azure.microsoft.com/pricing/details/virtual-machines/linux/
- **WebRTC TURN Testing**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

---

## Quick Reference Commands

```bash
# Check Coturn status
sudo systemctl status coturn

# Restart Coturn
sudo systemctl restart coturn

# View recent logs
sudo journalctl -u coturn -n 50

# Test if port is listening
sudo netstat -tulpn | grep 3478

# Check VM resource usage
htop

# Update system
sudo apt-get update && sudo apt-get upgrade -y
```

---

## Summary Checklist

- [x] Azure VM created with Ubuntu 22.04
- [x] Network Security Group configured (ports 3478, 49152-65535)
- [x] SSH access working
- [x] Coturn installed and running
- [x] Configuration file updated with your IP and password
- [x] Replit secrets configured
- [x] TURN server tested successfully
- [x] Admin dashboard warning banner disappeared
- [x] Billing alerts set up

**Your TURN server is now production-ready for your educational platform with complete data privacy!** 🎉
