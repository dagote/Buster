# Starting Frontend & Backend Together

## Quick Start

You have two options to start both servers:

### Option 1: Batch File (Easiest)
```bash
start-dev.bat
```
Double-click the file or run it from PowerShell/Command Prompt.

### Option 2: PowerShell Script
```powershell
.\start-dev.ps1
```

## What This Does

Both scripts will:
1. ✅ Start the **Backend Server** in a new window (http://localhost:8000)
2. ✅ Start the **Frontend Server** in another new window (http://localhost:3000)
3. ✅ Display startup messages showing both URLs

## Output

You'll see something like:
```
========================================
   Bitcino Development Environment
========================================

Starting Backend Server...
Starting Frontend Server...

========================================
   Servers Starting...
========================================

Backend:  http://localhost:8000
Frontend: http://localhost:3000

Press Ctrl+C in either window to stop that service.
Close both windows when done.
```

Then:
- **Window 1 (Backend)** shows Python/Flask logs
- **Window 2 (Frontend)** shows Vite dev server logs and auto-opens browser

## Stopping the Servers

### Option A: Close Windows
Simply close either window to stop that service. Close both when done.

### Option B: Ctrl+C
Press `Ctrl+C` in any window to stop that service.

## Troubleshooting

### Backend not starting?
- Make sure you're running from the project root (`c:\projects\bitcino\`)
- Check Python is installed: `python --version`
- Check you have dependencies: `pip install flask`

### Frontend not starting?
- Make sure Node.js is installed: `node --version`
- Check you did `npm install` in the frontend directory first
- Try running `npm run dev` manually in `frontend\` directory

### Can't find the scripts?
- Make sure you're in the project root: `c:\projects\bitcino\`
- Scripts should be in the root directory alongside `frontend\` and `backend\`

## If You Want Everything in One Window

If you prefer all output in a single terminal, run these commands manually:

**Terminal 1 (Backend):**
```bash
cd backend
python main.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

This gives you full control and visibility into both processes.

## First Time Setup

If you haven't set up the frontend yet:
```bash
cd frontend
npm install
```

Then use either start script.

## URLs

After starting:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000

The frontend will auto-open in your browser on first run.
