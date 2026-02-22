@echo off
REM Start Buster Frontend and Backend together

REM Change to script directory
cd /d "%~dp0"

echo.
echo ========================================
echo   Buster Development Environment
echo ========================================
echo.
echo Current directory: %CD%
echo.

REM Verify directories exist
if not exist "server" (
    echo ERROR: server directory not found
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend directory not found
    pause
    exit /b 1
)

if not exist "server\.env" (
    echo ERROR: server\.env not found
    echo.
    echo Please create server\.env with your configuration
    pause
    exit /b 1
)

echo [OK] Directories verified
echo.

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r server\requirements.txt --quiet 2>nul
echo.

REM Start services
echo ========================================
echo   Starting Services
echo ========================================
echo.

echo Starting Backend Server...
start "Buster Backend" cmd /k "cd /d %CD%\server && python main.py"

timeout /t 3 /nobreak

echo Starting Frontend Server...
start "Buster Frontend" cmd /k "cd /d %CD%\frontend && npm run dev"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Both servers should be launching in separate windows...
echo.
pause
