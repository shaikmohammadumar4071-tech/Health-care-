@echo off
TITLE FedHospital-AI Launcher
color 0B
echo ===============================================================================
echo       FedHospital-AI: Privacy-Preserving Federated Learning System
echo ===============================================================================
echo.

REM 1. Set PATH to include Node.js and Python
set "PATH=D:\nodejs;D:\python;C:\Users\pidug\Python311;C:\Users\pidug\Python311\Scripts;%PATH%"

REM Detect Python executable (prefer D:\python\python.exe if present)
if exist "D:\python\python.exe" (
    set "PYTHON_EXE=D:\python\python.exe"
) else (
    set "PYTHON_EXE=python"
)

REM Detect Node.js / NPM executable (prefer D:\nodejs if present)
if exist "D:\nodejs\npm.cmd" (
    set "NPM_CMD=D:\nodejs\npm.cmd"
) else (
    set "NPM_CMD=npm"
)

echo [1/2] Selected Runtimes:
echo   - Python: %PYTHON_EXE%
echo   - NPM:    %NPM_CMD%
echo.

echo [2/2] Launching Backend and Frontend in dedicated CMD windows...
echo.

REM 1. Launch FastAPI Backend on Port 8000
start "FedHospital-AI Backend API (Port 8000)" cmd /k "cd /d d:\shaik\backend && "%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM 2. Launch Vite React Frontend on Port 3000
start "FedHospital-AI React Frontend (Port 3000)" cmd /k "cd /d d:\shaik\frontend && "%NPM_CMD%" run dev"

echo ===============================================================================
echo  Application is starting up!
echo.
echo  * Interactive Web UI (3D Welcome Page):  http://localhost:3000
echo  * Backend REST API:                      http://localhost:8000
echo  * Swagger API Documentation:             http://localhost:8000/docs
echo ===============================================================================
echo.
echo  NOTE: Please keep the two opened CMD terminal windows running while
echo        using the application in your browser.
echo.
echo  Press any key to close this launcher window...
pause >nul
