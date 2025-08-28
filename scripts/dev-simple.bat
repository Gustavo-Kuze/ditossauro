@echo off
REM Simple development script for OpenWispr on Windows
REM Minimal version for quick testing

echo 🚀 Starting OpenWispr (Simple Mode)...
echo Project root: %CD%

REM Just run the basic Tauri dev command
echo [INFO] Installing frontend dependencies if needed...
if not exist "frontend\node_modules" (
    cd frontend
    npm install
    cd ..
)

echo [INFO] Starting Tauri development server...
npm run tauri dev

pause