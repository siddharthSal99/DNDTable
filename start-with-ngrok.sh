#!/bin/bash

echo "========================================"
echo "D&D Table - Starting with ngrok tunnel"
echo "========================================"
echo ""
echo "Make sure ngrok is installed and configured!"
echo "Download from: https://ngrok.com/download"
echo ""
echo "Starting D&D Table server on port 3000..."
npm start &
SERVER_PID=$!
sleep 3
echo ""
echo "Starting ngrok tunnel..."
echo "Your public URL will appear below."
echo ""
ngrok http 3000

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT

