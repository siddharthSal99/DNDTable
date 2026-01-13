#!/bin/bash

echo "========================================"
echo "D&D Table - Starting with Cloudflare Tunnel"
echo "========================================"
echo ""
echo "Make sure cloudflared is installed!"
echo "Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
echo ""
echo "Starting D&D Table server on port 3000..."
npm start &
SERVER_PID=$!
sleep 3
echo ""
echo "Starting Cloudflare tunnel..."
echo "Your public URL will appear below."
echo ""
cloudflared tunnel --url http://localhost:3000

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT

