@echo off
echo ===================================================
echo   NIVA AI Assistant - Database Backup Utility
echo ===================================================
echo Running database snapshot...
node "%~dp0backup-db.js"
if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Backup completed successfully!
) else (
    echo.
    echo [ERROR] Backup failed with exit code %ERRORLEVEL%
)
pause
