@echo off
REM Build script for OpenWispr on Windows
REM Builds the application for production distribution

echo 🚀 Building OpenWispr...
echo Project root: %CD%

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python 3 is not installed or not in PATH
        pause
        exit /b 1
    )
)

REM Check Rust/Cargo
cargo --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust/Cargo is not installed or not in PATH
    pause
    exit /b 1
)

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    pip3 install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
)
cd ..

REM Build the application
echo [INFO] Building application...
npm run tauri build
if errorlevel 1 (
    echo [ERROR] Failed to build application
    pause
    exit /b 1
)

echo ✅ Build completed successfully!
echo 📁 Check the 'src-tauri\target\release\bundle' directory for the built application
pause