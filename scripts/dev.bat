@echo off
REM Development script for OpenWispr on Windows
REM Sets up the development environment and starts the application

echo 🚀 Starting OpenWispr in development mode...
echo Project root: %CD%

REM Enable debug mode - comment this line to disable verbose output
set DEBUG=1

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
) else (
    if defined DEBUG (
        echo [DEBUG] Node.js version:
        node --version
    )
    echo [OK] Node.js is available
)

REM Check Python
echo [INFO] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [DEBUG] 'python' command not found, trying 'python3'...
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python 3 is not installed or not in PATH
        echo Please install Python from https://python.org/
        pause
        exit /b 1
    ) else (
        if defined DEBUG (
            echo [DEBUG] Python3 version:
            python3 --version
        )
        echo [OK] Python3 is available
        set PYTHON_CMD=python3
        set PIP_CMD=pip3
    )
) else (
    if defined DEBUG (
        echo [DEBUG] Python version:
        python --version
    )
    echo [OK] Python is available
    set PYTHON_CMD=python
    set PIP_CMD=pip
)

REM Check Rust/Cargo
echo [INFO] Checking Rust/Cargo...
cargo --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust/Cargo is not installed or not in PATH
    echo Please install Rust from https://rustup.rs/
    echo [INFO] You can continue without Rust, but you'll need to install it later
    echo Press any key to continue anyway, or Ctrl+C to exit...
    pause >nul
    set SKIP_RUST=1
) else (
    if defined DEBUG (
        echo [DEBUG] Cargo version:
        cargo --version
    )
    echo [OK] Rust/Cargo is available
)

REM Check Tauri CLI (only if Rust is available)
if not defined SKIP_RUST (
    echo [INFO] Checking Tauri CLI...
    cargo tauri --version >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Tauri CLI not found, installing...
        echo [INFO] This may take a few minutes...
        cargo install tauri-cli
        if errorlevel 1 (
            echo [ERROR] Failed to install Tauri CLI
            echo [INFO] You can try installing it manually later: cargo install tauri-cli
            set SKIP_TAURI=1
        ) else (
            echo [OK] Tauri CLI installed successfully
        )
    ) else (
        if defined DEBUG (
            echo [DEBUG] Tauri CLI version:
            cargo tauri --version
        )
        echo [OK] Tauri CLI is available
    )
)

REM Install frontend dependencies if needed
echo [INFO] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

REM Install backend dependencies if needed
echo [INFO] Checking backend dependencies...
%PYTHON_CMD% -c "import faster_whisper" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing backend dependencies...
    cd backend
    %PIP_CMD% install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Backend dependencies installed
) else (
    echo [OK] Backend dependencies already installed
)

REM Create Python virtual environment if it doesn't exist (optional)
echo [INFO] Checking Python virtual environment...
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    %PYTHON_CMD% -m venv venv
    if errorlevel 1 (
        echo [WARN] Failed to create virtual environment, continuing without it...
    ) else (
        call venv\Scripts\activate.bat
        pip install -r backend\requirements.txt
        echo [OK] Virtual environment created and activated
    )
) else (
    echo [INFO] Activating Python virtual environment...
    call venv\Scripts\activate.bat
    echo [OK] Virtual environment activated
)

REM Start the development server
echo.
echo ============================================
echo [INFO] Starting development server...
echo [INFO] The application will open in a new window
echo [INFO] Press Ctrl+C to stop the development server
echo ============================================
echo.

REM Run in development mode
if defined SKIP_RUST (
    echo [INFO] Rust not available, trying alternative approach...
    echo [INFO] Make sure to install Rust and Tauri CLI for full functionality
    pause
) else if defined SKIP_TAURI (
    echo [INFO] Tauri CLI not available, trying npm run tauri dev...
    npm run tauri dev
) else (
    echo [INFO] Running: npm run tauri dev
    npm run tauri dev
)

echo.
echo [INFO] Development server stopped
pause