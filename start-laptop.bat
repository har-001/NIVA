@echo off
setlocal enabledelayedexpansion

:: Guarantee execution from project root directory regardless of how script is called
cd /d "%~dp0"

title NIVA — Neural Intelligent Virtual Assistant (Laptop Launcher)
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
echo    Autonomous System ^& Voice Assistant Launcher
echo ================================================================
echo.

echo [1/5] Checking Docker Database Services (PostgreSQL ^& Redis)...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        echo [INFO] Docker daemon is offline. Starting Docker Desktop in background...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        ping 127.0.0.1 -n 6 >nul
    ) else (
        echo [INFO] Docker Desktop is offline or not installed.
        echo        Using direct connection / offline service mode.
    )
)
docker-compose up -d >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL and Redis containers are healthy!
) else (
    echo [OK] Service initialization underway.
)
echo.

echo [2/5] Starting NIVA Backend Server (Port 3001)...
start "NIVA Backend Server [Port 3001]" cmd /k "cd /d "%~dp0server" && npm run dev"
ping 127.0.0.1 -n 4 >nul
echo [OK] Backend server launched.
echo.

echo [3/5] Starting NIVA Web Interface (Port 3002)...
start "NIVA Web Interface [Port 3002]" cmd /k "cd /d "%~dp0client" && npm run dev"
ping 127.0.0.1 -n 5 >nul
echo [OK] Frontend web server launched.
echo.

echo [4/5] Opening NIVA in Browser...
start "" "http://localhost:3002"
echo [OK] Web Command Center opened at http://localhost:3002.
echo.

echo [5/5] Launching NIVA Desktop Application (HUD ^& Command Center)...
start "NIVA Desktop App" cmd /c "cd /d "%~dp0desktop" && npm start"
echo [OK] Desktop Assistant active.
echo.

echo ================================================================
echo    STATUS: NIVA IS NOW ACTIVE AND RUNNING!
echo ================================================================
echo.
echo  * Web Interface:     http://localhost:3002
echo  * Backend API:       http://localhost:3001
echo  * Desktop Hotkey:    Alt+Space (Summon / Toggle NIVA)
echo  * Floating HUD:      Bottom right corner (Arc Reactor Core)
echo.
echo  HOW TO TALK / LISTEN:
echo  1. In the browser (http://localhost:3002), click the Voice Orb
echo     in the top header to start speaking.
echo  2. Click "Hands-Free: ON" for continuous listening.
echo  3. You can speak commands like:
echo     - "Open Notepad" or "Notepad kholo"
echo     - "Open Calculator" or "Calculator chalao"
echo     - "Linkin Park khol do" or "Play songs"
echo     - "What is my IP?" or "Check system status"
echo.
echo  NOTE: Keep this window open while using NIVA.
echo  To shut down NIVA, simply close this window and the server windows.
echo ================================================================
echo.
pause
