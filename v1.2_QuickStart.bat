@echo off
:: UTF-8 코드페이지 설정 (한글 깨짐 및 명령줄 파싱 오류 방지)
chcp 65001 > nul

set VERSION=v1.2
set PORT=9000
title [INSPORT AI] TEST LAUNCHER %VERSION%

echo ======================================================
echo    🚀 INSPORT AI CHATBOT - %VERSION% TEST LAUNCHER
echo    - 프로젝트 서버 및 브라우저 원클릭 가동
echo    - 백엔드: http://localhost:3000
echo    - 프론트엔드: http://localhost:%PORT%
echo ======================================================

:: 현재 배치 파일이 있는 위치로 이동
cd /d "%~dp0"

:: 1. 백엔드 서버(Node.js) 실행
echo [1/3] 백엔드(3000) 가동 중...
start "INSPORT_BACKEND" cmd /k "cd /d kakao-backend && node server.js"

:: 2. 프론트엔드 서버(Vite) 실행 - 포트 9000 고정
echo [2/3] 프론트엔드(%PORT%) 가동 중...
start "INSPORT_FRONTEND" cmd /k "cd /d insport-chatbot && npm run dev -- --port %PORT%"

:: 3. 서비스 대기 및 브라우저 호출 (네트워크 안정화 5초 대기)
echo [3/3] 서버 가동 대기 및 브라우저 호출 (5초)...
timeout /t 5 > nul

:: 캐시 방지 정책에 따라 버전 시그니처(?v=1.2)를 포함하여 브라우저 오픈
echo [SUCCESS] 모든 시스템이 준비되었습니다!
start http://localhost:%PORT%/?v=%VERSION%

echo.
echo ------------------------------------------------------
echo [TIP] 화면이 정상적으로 나오지 않으면 Ctrl + F5를 눌러주세요.
echo 도움말: 서비스 종료 시 실행된 명령 창(cmd)을 닫아주세요.
echo ------------------------------------------------------
pause
