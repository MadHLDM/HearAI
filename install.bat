@echo off
color 0A
title HearAI - Auto Installer

echo ===============================================
echo   HEARAI - AUTO INSTALLER
echo ===============================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org
    echo.
    echo Choose the "LTS" version and restart this installer after installation.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js found: %%i
)

REM Check if Python is installed
echo [2/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found!
    echo.
    echo Please download and install Python from:
    echo https://python.org
    echo.
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo ✅ Python found: %%i
)

echo.
echo [3/5] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed
    echo.
    echo This usually means:
    echo   • No internet connection
    echo   • Node.js not properly installed
    echo   • Antivirus blocking npm
    pause
    exit /b 1
) else (
    echo ✅ Node.js dependencies installed
)

echo.
echo [4/5] Installing Python AI dependencies...
echo This may take 3-5 minutes for first-time installation...
echo Installing OpenAI Whisper and PyTorch (CPU version)...
pip install -r python/requirements.txt
if errorlevel 1 (
    echo ❌ Python dependency installation failed
    echo.
    echo Common solutions:
    echo   • Run as administrator
    echo   • Check internet connection
    echo   • Update pip: python -m pip install --upgrade pip
    pause
    exit /b 1
) else (
    echo ✅ Python dependencies installed
)

echo.
echo [5/5] Testing installation...
python python/transcribe.py --help >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Warning: Transcription test failed - may work anyway
) else (
    echo ✅ Transcription system working
)

echo.
echo ===============================================
echo   🎉 INSTALLATION COMPLETE! 🎉
echo ===============================================
echo.
echo HearAI is ready to use!
echo.
echo 🚀 TO START THE APP:
echo   • Double-click "run.bat"
echo   • OR run "npm start" in this folder
echo.
echo 💡 IMPORTANT TIPS:
echo   • Use speakers or regular headphones (NOT gaming headsets like Logitech G733)
echo   • The first transcription will be slower (downloading AI model ~140MB)
echo   • Press Ctrl+F9 to start/stop recording from anywhere
echo   • Desktop audio works best with built-in speakers
echo.
echo Press any key to launch the app now...
pause >nul

echo.
echo Starting HearAI...
npm start
