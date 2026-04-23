@echo off
title Game Portal Launcher
echo --- Starting Game Portal Locally ---

:: Set base directories
set "BASE_DIR=%~dp0"
set "BACKEND_DIR=%BASE_DIR%backend"
set "FRONTEND_DIR=%BASE_DIR%frontend"
set "UVICORN_PATH=%BACKEND_DIR%\venv\Scripts\uvicorn.exe"

:: 1. Check for Uvicorn
if not exist "%UVICORN_PATH%" (
    echo [ERROR] Could not find uvicorn at %UVICORN_PATH%
    echo Please ensure you ran the setup script and dependencies are installed.
    pause
    exit /b
)

:: 2. Start Backend in a new window
echo Starting FastAPI Backend...
:: Change this line:
start "FastAPI Backend" cmd /k "%UVICORN_PATH% app.main:app --reload --app-dir %BACKEND_DIR% --host 192.168.1.40"

:: 3. Start Frontend in a new window
echo Starting React Frontend...
start "React Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo Both services are starting...
echo API: http://localhost:8000
echo Frontend: http://localhost:5173
pause