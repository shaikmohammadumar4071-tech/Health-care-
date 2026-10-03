@echo off
TITLE FedHospital-AI: Privacy-Preserving Smart Hospital FL
color 0B
echo ===============================================================================
echo       FedHospital-AI: Privacy-Preserving Federated Learning System
echo ===============================================================================
echo.

set "PATH=D:\nodejs;D:\python;C:\Users\pidug\Python311;C:\Users\pidug\Python311\Scripts;%PATH%"

if exist "D:\python\python.exe" (
    set "PYTHON_EXE=D:\python\python.exe"
) else (
    set "PYTHON_EXE=python"
)

if exist "D:\nodejs\npm.cmd" (
    set "NPM_CMD=D:\nodejs\npm.cmd"
) else (
    set "NPM_CMD=npm"
)

echo [1/2] Launching FastAPI Backend on port 8000...
start "FedHospital Backend API (Port 8000)" cmd /k "cd /d d:\shaik\backend && "%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Launching Vite Frontend on port 3000...
start "FedHospital React Frontend (Port 3000)" cmd /k "cd /d d:\shaik\frontend && "%NPM_CMD%" run dev"

echo ===============================================================================
echo  Application is running!
echo  * Interactive Web UI (3D Welcome Page):  http://localhost:3000
echo  * Backend REST API:                      http://localhost:8000
echo  * Interactive Swagger Documentation:     http://localhost:8000/docs
echo ===============================================================================
echo.
pause
