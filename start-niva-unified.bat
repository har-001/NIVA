@echo off
setlocal enabledelayedexpansion

:: Guarantee execution from project root directory regardless of how script is called
cd /d "%~dp0"

title NIVA — Neural Intelligent Virtual Assistant (Unified Master Launcher)
color 0B

echo ================================================================
echo       _   _ _____ _    _          
echo      ^| \ ^| ^|_   _^| ^|  ^| ^|   /\     
echo      ^|  \^| ^| ^| ^| ^| ^|  ^| ^|  /  \    
echo      ^| . ` ^| ^| ^| ^| ^|  ^| ^| / /\ \   
echo      ^| ^|\  ^|_^| ^|_ \ \_/ // ____ \  
echo      ^|_^| \_^|_____^| \___//_/    \_\ 
echo.
echo    NEURAL INTELLIGENT VIRTUAL ASSISTANT
echo    Unified Master Ecosystem: Web + Desktop (Tauri) + Mobile (Expo)
echo ================================================================
echo.

echo [1/6] Checking Database Services (PostgreSQL & Redis)...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        echo [INFO] Docker daemon is offline. Launching Docker Desktop...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        ping 127.0.0.1 -n 6 >nul
    ) else (
        echo [INFO] Docker Desktop is offline. Operating with local fallback drivers.
    )
)
docker-compose up -d >nul 2>&1
echo [OK] Storage stack ready.
echo.

echo [2/6] Starting NIVA Backend Server (Port 3001)...
start "NIVA Backend Server [Port 3001]" cmd /k "cd /d "%~dp0server" && npm run dev"
ping 127.0.0.1 -n 4 >nul
echo [OK] Backend server active at http://localhost:3001.
echo.

echo [3/6] Starting NIVA Web Console (Port 3002)...
start "NIVA Web Console [Port 3002]" cmd /k "cd /d "%~dp0client" && npm run dev"
ping 127.0.0.1 -n 5 >nul
echo [OK] Frontend web console active at http://localhost:3002.
echo.

echo [4/6] Launching Desktop Arc HUD Assistant...
if exist "%~dp0desktop-tauri" (
    start "NIVA Desktop Tauri HUD" cmd /c "cd /d "%~dp0desktop-tauri" && npm run tauri dev"
) else (
    start "NIVA Desktop HUD" cmd /c "cd /d "%~dp0desktop" && npm start"
)
echo [OK] Desktop Assistant active.
echo.

echo [5/6] Starting Expo Mobile Client Bundler...
start "NIVA Mobile Metro Bundler" cmd /k "cd /d "%~dp0mobile" && npx expo start"
echo [OK] Mobile bundler started (Scan QR code with Expo Go on Android).
echo.

echo [6/6] Launching Web Browser Command Center...
start "" "http://localhost:3002"
echo [OK] Command Center active.
echo.

echo ================================================================
echo    STATUS: NIVA UNIFIED SYSTEM IS FULLY ONLINE!
echo ================================================================
echo.
echo  * Web Command Center:   http://localhost:3002
echo  * Backend Core API:     http://localhost:3001
echo  * Mobile Expo Metro:    http://localhost:8081
echo  * Desktop Hotkey:       Alt+Space (Summon Arc Reactor HUD)
echo.
echo  INTERACTIVE VOICE & SYSTEM CAPABILITIES:
echo  1. Web & Mobile: Click Arc Reactor to speak or listen
echo  2. Mobile Features: Live Token Stream, Camera Vision, 
echo                     Remote Desktop Deck, Memory Hub, Comms
echo  3. Desktop Control: Launch VS Code, Notepad, Calc, Volume, Mute
echo.
echo  Keep this master window open while using NIVA.
echo ================================================================
echo.
pause
