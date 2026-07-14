@echo off
chcp 65001 >nul
echo ========================================
echo   MedTerm 医学术语通 - 启动中...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 启动服务端...
start "MedTerm-Server" /min cmd /c "npx tsx api/server.ts"

echo [2/2] 启动内网穿透...
timeout /t 3 /nobreak >nul
npx localtunnel --port 3001

pause