@echo off
REM Development script for OpenWispr on Windows
REM Sets up the development environment and starts the application

echo 🚀 Starting OpenWispr in development mode...
echo Project root: %CD%

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
echo [INFO] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Python
echo [INFO] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python 3 is not installed or not in PATH
        echo Please install Python from https://python.org/
        pause
        exit /b 1
    )
)

REM Check Rust/Cargo
echo [INFO] Checking Rust/Cargo...
cargo --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust/Cargo is not installed or not in PATH
    echo Please install Rust from https://rustup.rs/
    pause
    exit /b 1
)

REM Check Tauri CLI
echo [INFO] Checking Tauri CLI...
cargo tauri --version >nul 2>&1
if errorlevel 1 (
    echo [WARN] Tauri CLI not found, installing...
    cargo install tauri-cli
)

REM Install frontend dependencies if needed
echo [INFO] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

REM Install backend dependencies if needed
echo [INFO] Checking backend dependencies...
python -c "import faster_whisper" >nul 2>&1
if errorlevel 1 (
    python3 -c "import faster_whisper" >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Installing backend dependencies...
        cd backend
        pip install -r requirements.txt
        cd ..
    )
)

REM Create Python virtual environment if it doesn't exist
echo [INFO] Checking Python virtual environment...
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        python3 -m venv venv
    )
    call venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
) else (
    echo [INFO] Activating Python virtual environment...
    call venv\Scripts\activate.bat
)

REM Start the development server
echo [INFO] Starting development server...
echo [INFO] The application will open in a new window
echo [INFO] Press Ctrl+C to stop the development server

REM Run in development mode
echo [INFO] Running in development mode...
npm run tauri dev
