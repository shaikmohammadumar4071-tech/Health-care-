@echo off
TITLE FedHospital-AI Automated Test Suite
color 0A
echo ===============================================================================
echo            Running PyTest Automated Verification Suite
echo ===============================================================================
echo.

set "PATH=D:\nodejs;C:\Users\pidug\Python311;C:\Users\pidug\Python311\Scripts;%PATH%"

set "PYTHON_EXE=python"
python --version 2>NUL
if errorlevel 1 (
    set "PYTHON_EXE=D:\python\python.exe"
)

cd /d d:\shaik\backend
%PYTHON_EXE% -m pytest tests/test_federated_system.py -v

echo.
echo ===============================================================================
echo  Test run complete. Press any key to close.
echo ===============================================================================
pause >nul
