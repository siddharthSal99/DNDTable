# Deployment Guide - Making Your D&D Table Accessible Online

This guide explains how to safely make your D&D Table app accessible to friends who are not on your local network.

## ⚠️ Security Reminder

Before exposing your app to the internet:
1. **Set a strong password** using the `PASSWORD_HASH` environment variable
2. **Use HTTPS** when possible (most tunneling services provide this automatically)
3. **Only share the URL with trusted friends**
4. **Stop the server when not in use**

---

## Option 1: ngrok (Recommended - Easiest & Safest)

**ngrok** creates a secure tunnel to your local server. It's free, easy to use, and provides HTTPS automatically.

### Setup Steps:

1. **Install ngrok:**
   - Download from https://ngrok.com/download
   - Or use a package manager:
     - Windows (Chocolatey): `choco install ngrok`
     - Mac (Homebrew): `brew install ngrok`
     - Or download the executable and add it to your PATH

2. **Sign up for a free account** (optional but recommended):
   - Go to https://dashboard.ngrok.com/signup
   - Get your authtoken from the dashboard
   - Run: `ngrok config add-authtoken YOUR_TOKEN`

3. **Start your D&D Table server:**
   ```bash
   npm start
   ```

4. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

5. **Share the HTTPS URL:**
   - ngrok will display a URL like: `https://abc123.ngrok-free.app`
   - Share this URL with your friends
   - The URL changes each time you restart ngrok (unless you have a paid plan)

### Tips:
- **Free tier**: URLs change on restart, includes ngrok branding page
- **Paid tier**: Fixed domain names, no branding page
- **WebSocket support**: Works automatically with ngrok
- **Security**: HTTPS is enabled by default

---

## Option 2: Cloudflare Tunnel (Free & No Account Required)

**Cloudflare Tunnel** (cloudflared) is free, doesn't require port forwarding, and provides HTTPS.

### Setup Steps:

1. **Install cloudflared:**
   - Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   - Or use a package manager:
     - Windows (Chocolatey): `choco install cloudflared`
     - Mac (Homebrew): `brew install cloudflared`

2. **Start your D&D Table server:**
   ```bash
   npm start
   ```

3. **In a new terminal, start the tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

4. **Share the HTTPS URL:**
   - cloudflared will display a URL like: `https://random-words-1234.trycloudflare.com`
   - Share this URL with your friends

### Tips:
- **Completely free** with no account required
- **HTTPS enabled** automatically
- **WebSocket support**: Works automatically
- **URLs change** on each restart (random subdomain)

---

## Option 3: localtunnel (Simple & Free)

**localtunnel** is a simple npm package that creates tunnels.

### Setup Steps:

1. **Install localtunnel globally:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your D&D Table server:**
   ```bash
   npm start
   ```

3. **In a new terminal, start the tunnel:**
   ```bash
   lt --port 3000
   ```

4. **Share the URL:**
   - localtunnel will display a URL like: `https://random-name.loca.lt`
   - Share this URL with your friends

### Tips:
- **Free** but may show ads
- **HTTPS enabled** automatically
- **WebSocket support**: May require additional configuration
- **URLs change** on each restart

---

## Option 4: Port Forwarding (Advanced - Requires Router Access)

⚠️ **Warning**: This exposes your server directly to the internet. Only use if you understand the security implications.

### Setup Steps:

1. **Find your router's IP address:**
   - Usually `192.168.1.1` or `192.168.0.1`
   - Check your router's documentation

2. **Access your router's admin panel:**
   - Open a browser and go to the router IP
   - Log in with admin credentials

3. **Set up port forwarding:**
   - Find "Port Forwarding" or "Virtual Server" settings
   - Forward external port (e.g., 3000) to your computer's local IP on port 3000
   - Set protocol to TCP

4. **Find your public IP:**
   - Visit https://whatismyipaddress.com/
   - Or check your router's status page

5. **Configure firewall:**
   - Allow incoming connections on port 3000
   - Windows: Windows Firewall → Allow app → Node.js
   - Mac/Linux: Configure your firewall appropriately

6. **Share the URL:**
   - Share: `http://YOUR_PUBLIC_IP:3000`
   - Note: This uses HTTP, not HTTPS (less secure)

### Security Considerations:
- ⚠️ Your server is directly exposed to the internet
- ⚠️ Use a strong password (set `PASSWORD_HASH` environment variable)
- ⚠️ Consider using a dynamic DNS service if your IP changes
- ⚠️ Your IP address may change (check with your ISP)

---

## Setting a Strong Password

**Important**: Before exposing your app online, set a strong password!

### Generate a password hash:

1. **Create a simple script** (or use Node.js REPL):
   ```bash
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash));"
   ```

2. **Set the environment variable:**
   - **Windows (PowerShell):**
     ```powershell
     $env:PASSWORD_HASH="your_bcrypt_hash_here"
     npm start
     ```
   - **Windows (CMD):**
     ```cmd
     set PASSWORD_HASH=your_bcrypt_hash_here
     npm start
     ```
   - **Mac/Linux:**
     ```bash
     export PASSWORD_HASH="your_bcrypt_hash_here"
     npm start
     ```

3. **Or create a `.env` file** (requires `dotenv` package):
   ```bash
   npm install dotenv
   ```
   Then create `.env`:
   ```
   PASSWORD_HASH=your_bcrypt_hash_here
   ```

---

## Quick Start Scripts

Helper scripts are included in this project to make starting easier:

### ngrok Quick Start

**Windows:**
```batch
start-with-ngrok.bat
```

**Mac/Linux:**
```bash
chmod +x start-with-ngrok.sh
./start-with-ngrok.sh
```

### Cloudflare Tunnel Quick Start

**Mac/Linux:**
```bash
chmod +x start-with-cloudflare.sh
./start-with-cloudflare.sh
```

These scripts will start both your server and the tunnel automatically.

---

## Troubleshooting

### WebSocket Connection Issues
- Most tunneling services support WebSockets automatically
- If you have issues, check the service's documentation
- ngrok and Cloudflare Tunnel handle WebSockets well

### Connection Timeouts
- Make sure your server is running
- Check that the port (3000) is correct
- Verify firewall settings

### Password Not Working
- Make sure you're using the correct password
- If using `PASSWORD_HASH`, verify the hash was generated correctly
- Check that environment variables are set properly

### Friends Can't Connect
- Verify the tunnel/port forwarding is active
- Check that you shared the correct URL (HTTPS for tunnels)
- Ensure your computer isn't sleeping or the network isn't disconnected

---

## Recommendation

For most users, **ngrok** (Option 1) is the best choice because:
- ✅ Easy to set up
- ✅ Automatic HTTPS
- ✅ Works with WebSockets
- ✅ No router configuration needed
- ✅ Free tier available
- ✅ Secure (tunnel is encrypted)

For a completely free option with no account needed, use **Cloudflare Tunnel** (Option 2).

