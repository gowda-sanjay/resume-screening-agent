@echo off
REM Quick GitHub Setup Script for Resume Screening Agent
REM Replace YOUR_USERNAME with your actual GitHub username

setlocal enabledelayedexpansion

REM Colors (Windows 10+)
for /F %%A in ('echo prompt $H ^| cmd') do set "BS=%%A"

echo.
echo ===================================
echo Resume Screening Agent - GitHub Setup
echo ===================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed. Please install Git from https://git-scm.com
    pause
    exit /b 1
)

echo [1] Initializing Git repository...
git init

echo [2] Adding all files...
git add .

echo [3] Creating initial commit...
git commit -m "Initial commit: Resume screening agent with React frontend and FastAPI backend"

echo.
echo ===================================
echo IMPORTANT: Next steps
echo ===================================
echo.
echo 1. Create a repository on GitHub:
echo    - Go to https://github.com/new
echo    - Create repository named: resume-screening-agent
echo    - Copy the HTTPS URL (e.g., https://github.com/YOUR_USERNAME/resume-screening-agent.git)
echo.
echo 2. Run the following command with your URL:
echo    git remote add origin YOUR_GITHUB_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Then deployment will be automatic via Render and Netlify!
echo.
pause
