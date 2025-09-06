@echo off
echo Creating distribution package...

REM Create a clean distribution folder
if exist "..\HearAI-Distribution" rmdir /s /q "..\HearAI-Distribution"
mkdir "..\HearAI-Distribution"

REM Copy essential files (excluding node_modules and other build artifacts)
echo Copying application files...
xcopy "*.js" "..\HearAI-Distribution\" /Y
xcopy "*.html" "..\HearAI-Distribution\" /Y
xcopy "*.css" "..\HearAI-Distribution\" /Y
xcopy "*.json" "..\HearAI-Distribution\" /Y
xcopy "*.md" "..\HearAI-Distribution\" /Y
xcopy "*.bat" "..\HearAI-Distribution\" /Y

REM Copy directories
echo Copying directories...
xcopy "python" "..\HearAI-Distribution\python\" /E /I /Y
xcopy "assets" "..\HearAI-Distribution\assets\" /E /I /Y

REM Copy the distribution README as the main README
copy "DISTRIBUTION_README.md" "..\HearAI-Distribution\README.md" /Y

echo.
echo ===============================================
echo   📦 DISTRIBUTION PACKAGE CREATED!
echo ===============================================
echo.
echo Location: ..\HearAI-Distribution\
echo.
echo This folder contains everything needed for distribution:
echo   • install.bat - Auto-installer
echo   • run.bat - App launcher  
echo   • README.md - User instructions
echo   • All source files and dependencies
echo.
echo To distribute:
echo   1. Zip the "HearAI-Distribution" folder
echo   2. Send to users with instructions to run install.bat
echo.
pause
