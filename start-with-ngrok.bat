@echo off
echo ========================================
echo D&D Table - Starting with ngrok tunnel
echo ========================================
echo.
echo Make sure ngrok is installed and configured!
echo Download from: https://ngrok.com/download
echo.
echo Starting D&D Table server on port 3000...
start "D&D Table Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul
echo.
echo Starting ngrok tunnel...
echo Your public URL will appear in the ngrok window.
echo.
start "ngrok Tunnel" cmd /k "ngrok http 3000"
echo.
echo ========================================
echo Both windows are opening now.
echo Check the ngrok window for your public HTTPS URL.
echo Share that URL with your friends!
echo ========================================
pause

