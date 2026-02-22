# Start Buster Frontend and Backend in separate windows
# Usage: .\start-dev.ps1

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path $scriptDir

Set-Location $projectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Buster Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if directories exist
if (-not (Test-Path "server")) {
    Write-Host "Error: server directory not found in $projectRoot" -ForegroundColor Red
    Write-Host "Please ensure you have the complete project structure." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "Error: frontend directory not found in $projectRoot" -ForegroundColor Red
    Write-Host "Please ensure you have the complete project structure." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Verified server directory exists" -ForegroundColor Green
Write-Host "✓ Verified frontend directory exists" -ForegroundColor Green
Write-Host "Project root: $projectRoot" -ForegroundColor Yellow
Write-Host ""

# Start Backend (server)
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\server'; python main.py" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Servers Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in either window to stop that service." -ForegroundColor Cyan
Write-Host "Close both windows when done." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
