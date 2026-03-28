@echo off
title INSPORT AI - System Launcher
echo ======================================================
echo    INSPORT AI CHATBOT SYSTEM INITIALIZING...
echo ======================================================

set BASE_DIR=%~dp0

:: 1. Killing old ports
echo [1/3] Terminating any old server sessions (ports 3000, 9000)...
call npx kill-port 3000 9000 > nul 2>&1

:: 2. Launching Backend
echo [2/3] Starting Insport Backend Engine...
start "INSPORT_BACKEND" cmd /k "cd /d ""%BASE_DIR%insport-backend"" && node server.js"

:: 3. Launching Frontend
echo [3/3] Starting Insport Frontend UI...
start "INSPORT_FRONTEND" cmd /k "cd /d ""%BASE_DIR%insport-chatbot"" && npm run dev -- --port 9000"

echo.
echo Please wait 6 seconds while services are booting up...
timeout /t 6 /nobreak > nul

:: Open Browsers
echo Opening browser tabs automatically...
start http://localhost:9000/
start http://localhost:9000/admin

echo DONE! All services are active. You can now use the system.
pause
