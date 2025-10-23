# Azure Coturn TURN Server - TLS/SSL Setup Guide (R1.5)

## Overview
This guide enables TURN-TLS (R1.5) on your Azure Coturn server for encrypted relay connections. TLS provides an additional fallback when UDP and TCP are blocked by restrictive firewalls.

**Requirements:**
- Existing Azure VM with Coturn installed (follow `azure-coturn-ui-setup-guide.md` first)
- Domain name (optional, can use self-signed certificate for testing)
- ~15 minutes setup time

---

## Part 1: Open TLS Port in Azure Network Security Group

### Step 1: Access Your VM's Network Security Group
1. Go to https://portal.azure.com
2. Navigate to your VM: **Virtual machines** → **techlearnorbit-turn-vm**
3. Click **"Networking"** in the left sidebar
4. Click **"Network settings"**
5. Under **Inbound port rules**, click **"Create port rule"** → **"Inbound port rule"**

### Step 2: Add TURN TLS Port Rule
Fill in these values:
- **Source**: `Any`
- **Source port ranges**: `*`
- **Destination**: `Any`
- **Service**: `Custom`
- **Destination port ranges**: `5349`
- **Protocol**: `TCP`
- **Action**: `Allow`
- **Priority**: `330`
- **Name**: `Allow-TURN-TLS-5349`

Click **"Add"** and wait for the rule to be created (1-2 minutes).

---

## Part 2: Generate SSL Certificate

You have two options:

### Option A: Let's Encrypt (Production - Requires Domain)

**Prerequisites:** You need a domain name pointing to your VM's public IP.

1. SSH into your VM:
   ```bash
   ssh -i ~/Downloads/techlearnorbit-turn-key.pem azureuser@YOUR_VM_IP
   ```

2. Install Certbot:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot -y
   ```

3. Generate certificate (replace `turn.yourdomain.com` with your domain):
   ```bash
   sudo certbot certonly --standalone \
     -d turn.yourdomain.com \
     --preferred-challenges http \
     --agree-tos \
     --email your-email@example.com
   ```

4. Certificates will be created at:
   - Certificate: `/etc/letsencrypt/live/turn.yourdomain.com/fullchain.pem`
   - Private key: `/etc/letsencrypt/live/turn.yourdomain.com/privkey.pem`

5. Create symlinks for Coturn:
   ```bash
   sudo ln -s /etc/letsencrypt/live/turn.yourdomain.com/fullchain.pem /etc/ssl/turn_server_cert.pem
   sudo ln -s /etc/letsencrypt/live/turn.yourdomain.com/privkey.pem /etc/ssl/turn_server_pkey.pem
   ```

6. Set up auto-renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

### Option B: Self-Signed Certificate (Testing/Development)

1. SSH into your VM:
   ```bash
   ssh -i ~/Downloads/techlearnorbit-turn-key.pem azureuser@YOUR_VM_IP
   ```

2. Generate self-signed certificate:
   ```bash
   sudo openssl req -x509 -newkey rsa:4096 \
     -keyout /etc/ssl/turn_server_pkey.pem \
     -out /etc/ssl/turn_server_cert.pem \
     -days 365 -nodes \
     -subj "/CN=techlearnorbit-turn/O=TechLearnOrbit/C=IN"
   ```

3. Set correct permissions:
   ```bash
   sudo chmod 644 /etc/ssl/turn_server_cert.pem
   sudo chmod 600 /etc/ssl/turn_server_pkey.pem
   sudo chown turnserver:turnserver /etc/ssl/turn_server_*.pem
   ```

**Note**: Self-signed certificates will show browser warnings but will work for testing.

---

## Part 3: Update Coturn Configuration

1. Edit Coturn config:
   ```bash
   sudo nano /etc/turnserver.conf
   ```

2. Find these commented lines:
   ```conf
   # SSL certificates (optional for now, add later for TLS)
   # cert=/etc/ssl/turn_server_cert.pem
   # pkey=/etc/ssl/turn_server_pkey.pem
   ```

3. Uncomment and verify they match:
   ```conf
   # SSL certificates for TLS support (R1.5)
   cert=/etc/ssl/turn_server_cert.pem
   pkey=/etc/ssl/turn_server_pkey.pem
   ```

4. Verify `tls-listening-port` is set:
   ```conf
   tls-listening-port=5349
   ```

5. Save and exit:
   - Press **Ctrl+O** to save
   - Press **Enter** to confirm
   - Press **Ctrl+X** to exit

---

## Part 4: Restart Coturn and Verify

1. Restart Coturn service:
   ```bash
   sudo systemctl restart coturn
   ```

2. Check service status:
   ```bash
   sudo systemctl status coturn
   ```
   
   You should see **"active (running)"** in green.

3. Verify TLS port is listening:
   ```bash
   sudo netstat -tulpn | grep 5349
   ```
   
   Expected output:
   ```
   tcp        0      0 0.0.0.0:5349            0.0.0.0:*               LISTEN      1234/turnserver
   ```

4. Check Coturn logs:
   ```bash
   sudo journalctl -u coturn -n 50
   ```
   
   Look for:
   ```
   0: : TLS listener opened on 0.0.0.0:5349
   ```

---

## Part 5: Test TLS Connectivity

### Test 1: OpenSSL Connection Test

From your local computer, test if TLS port is reachable:

```bash
openssl s_client -connect YOUR_VM_IP:5349
```

**Success indicators:**
- Connection establishes (even if certificate is untrusted)
- You see certificate details
- No "Connection refused" error

Press **Ctrl+C** to exit.

### Test 2: WebRTC ICE Trickle Test

1. Go to: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

2. Add TLS TURN server:
   - **TURN URI**: `turns:YOUR_VM_IP:5349`
   - **TURN username**: `techlearn`
   - **TURN password**: Your password

3. Click **"Add Server"** → **"Gather candidates"**

4. **Success**: You should see entries with:
   ```
   typ relay raddr ... rport ... tcptype tls
   ```

### Test 3: From Replit Application

1. Restart your Replit application (changes auto-deploy)

2. Check browser console (F12) when joining a video call

3. Look for log:
   ```
   🔗 ICE Servers configured with TURN relay: {
     udp: "turn:IP:3478",
     tcp: "turn:IP:3478?transport=tcp",
     tls: "turns:IP:5349"
   }
   ```

4. In the admin dashboard, connection type should show:
   - **"TURN Relay (TLS)"** when TLS is being used

---

## Part 6: Firewall Summary

After setup, your VM should have these ports open:

| Port | Protocol | Purpose | Status |
|------|----------|---------|--------|
| 22 | TCP | SSH access | Required |
| 3478 | TCP/UDP | TURN (UDP & TCP) | Required |
| 5349 | TCP | TURN (TLS) | **Newly added** |
| 49152-65535 | UDP | TURN relay ports | Required |

---

## Troubleshooting

### Issue: Port 5349 not listening
**Solution**: Check Coturn config and restart
```bash
sudo nano /etc/turnserver.conf
# Verify tls-listening-port=5349 is set
sudo systemctl restart coturn
```

### Issue: Certificate errors
**Solution**: Verify certificate files exist and have correct permissions
```bash
ls -la /etc/ssl/turn_server_*.pem
sudo chmod 644 /etc/ssl/turn_server_cert.pem
sudo chmod 600 /etc/ssl/turn_server_pkey.pem
sudo chown turnserver:turnserver /etc/ssl/turn_server_*.pem
```

### Issue: TLS test fails but TCP works
**Solution**: Check Azure NSG port 5349 rule
1. Azure Portal → VM → Networking
2. Verify port 5349 TCP is allowed
3. Priority should be lower than 500

### Issue: "certificate verify failed"
**Solution**: This is normal for self-signed certificates
- Browsers/WebRTC will still use the connection
- For production, use Let's Encrypt (Option A)

---

## Certificate Renewal (Let's Encrypt Only)

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

1. Test renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

2. If successful, certbot will auto-renew via systemd timer

3. After renewal, restart Coturn:
   ```bash
   sudo systemctl reload coturn
   ```

4. (Optional) Create a renewal hook:
   ```bash
   sudo nano /etc/letsencrypt/renewal-hooks/deploy/restart-coturn.sh
   ```
   
   Add:
   ```bash
   #!/bin/bash
   systemctl reload coturn
   ```
   
   Make executable:
   ```bash
   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-coturn.sh
   ```

---

## Cost Impact

**Additional Cost**: **$0** (TLS uses existing VM)

- Same VM handles UDP, TCP, and TLS
- No additional bandwidth charges
- Certificate cost: $0 (Let's Encrypt is free)

---

## Security Best Practices

1. **Use Let's Encrypt in production** (Option A above)
2. **Keep certificates updated** (auto-renewal configured)
3. **Monitor certificate expiry**:
   ```bash
   sudo openssl x509 -in /etc/ssl/turn_server_cert.pem -noout -dates
   ```
4. **Rotate credentials** if certificate is compromised

---

## Verification Checklist

- [ ] Port 5349 TCP opened in Azure NSG
- [ ] SSL certificate generated (Let's Encrypt or self-signed)
- [ ] Certificate files have correct permissions
- [ ] Coturn config updated with cert/pkey paths
- [ ] Coturn service restarted successfully
- [ ] Port 5349 listening (netstat confirms)
- [ ] OpenSSL connection test passes
- [ ] WebRTC ICE trickle test shows "typ relay" with TLS
- [ ] Browser console shows TLS URL in ICE servers config
- [ ] Admin dashboard tracks TLS connections

---

## Quick Reference

```bash
# Check TLS port is listening
sudo netstat -tulpn | grep 5349

# View Coturn TLS logs
sudo journalctl -u coturn | grep -i tls

# Test TLS connection
openssl s_client -connect YOUR_VM_IP:5349

# Check certificate expiry
sudo openssl x509 -in /etc/ssl/turn_server_cert.pem -noout -dates

# Restart Coturn after config changes
sudo systemctl restart coturn
```

---

## Summary

**R1.5 TURN-TLS is now enabled!** Your platform now supports:
- ✅ R1.1: P2P WebRTC (direct connection)
- ✅ R1.2: STUN servers (NAT discovery)
- ✅ R1.3: TURN UDP (relay fallback)
- ✅ R1.4: TURN TCP (firewall fallback)
- ✅ R1.5: TURN TLS (encrypted relay fallback)

Your educational platform can now handle video sessions even in the most restrictive network environments (corporate firewalls, VPNs, etc.) with complete privacy and security! 🎉
