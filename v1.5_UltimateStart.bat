@echo off
set VERSION=v1.5
set PORT=9000
title [INSPORT AI] ULTIMATE LAUNCHER %VERSION%

:: UTF-8 Support
chcp 65001 > nul

echo ======================================================
echo    🚀 INSPORT AI CHATBOT - %VERSION% ULTIMATE
echo    - AI Model: Gemini 1.5 Flash-8B (Light speed)
echo    - Sync: Real-time Backend Integration
echo ======================================================

cd /d "%~dp0"

:: 1. Start Backend (3000)
echo [1/3] Starting Backend (Sync Engine)...
start "INSPORT_BACKEND" cmd /k "cd /d kakao-backend && node server.js"

:: 2. Start Frontend (9000)
echo [2/3] Starting Frontend (Mobile UI)...
start "INSPORT_FRONTEND" cmd /k "cd /d insport-chatbot && npm run dev -- --port %PORT%"

:: 3. Launch UI
echo [3/3] Finalizing Cloud Sync (5s)...
timeout /t 5 > nul

start http://localhost:%PORT%/?v=%VERSION%
echo [SUCCESS] System is ready. Enjoy testing, Boss!
pause
