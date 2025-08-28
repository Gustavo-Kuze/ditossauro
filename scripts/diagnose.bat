@echo off
REM Diagnostic script for OpenWispr on Windows
REM Helps identify what's causing the development script to stop

echo 🔍 OpenWispr Windows Diagnostic Tool
echo =====================================
echo.

echo [DIAG] Current directory: %CD%
echo [DIAG] Date/Time: %DATE% %TIME%
echo.

echo [DIAG] Checking Node.js...
node --version
if errorlevel 1 (
    echo [ERROR] Node.js not found
) else (
    echo [OK] Node.js is working
)
echo.

echo [DIAG] Checking Python...
python --version
if errorlevel 1 (
    echo [INFO] 'python' not found, trying 'python3'...
    python3 --version
    if errorlevel 1 (
        echo [ERROR] Neither 'python' nor 'python3' found
    ) else (
        echo [OK] python3 is working
    )
) else (
    echo [OK] python is working
)
echo.

echo [DIAG] Checking Rust/Cargo...
cargo --version
if errorlevel 1 (
    echo [ERROR] Cargo not found
) else (
    echo [OK] Cargo is working
)
echo.

echo [DIAG] Checking Tauri CLI...
cargo tauri --version
if errorlevel 1 (
    echo [ERROR] Tauri CLI not found
) else (
    echo [OK] Tauri CLI is working
)
echo.

echo [DIAG] Checking project structure...
if exist "frontend" (
    echo [OK] frontend/ directory exists
) else (
    echo [ERROR] frontend/ directory missing
)

if exist "backend" (
    echo [OK] backend/ directory exists  
) else (
    echo [ERROR] backend/ directory missing
)

if exist "src-tauri" (
    echo [OK] src-tauri/ directory exists
) else (
    echo [ERROR] src-tauri/ directory missing
)

if exist "package.json" (
    echo [OK] package.json exists
) else (
    echo [ERROR] package.json missing
)
echo.

echo [DIAG] Checking frontend dependencies...
if exist "frontend\node_modules" (
    echo [OK] frontend node_modules exists
) else (
    echo [WARN] frontend node_modules missing - need to run: npm install in frontend/
)

if exist "frontend\package.json" (
    echo [OK] frontend package.json exists
) else (
    echo [ERROR] frontend package.json missing
)
echo.

echo [DIAG] Testing npm commands...
echo [INFO] Testing 'npm --version'...
npm --version
if errorlevel 1 (
    echo [ERROR] npm command failed
) else (
    echo [OK] npm is working
)
echo.

echo [INFO] Testing 'npm run tauri --help'...
npm run tauri --help
if errorlevel 1 (
    echo [ERROR] npm run tauri failed
) else (
    echo [OK] npm run tauri is working
)
echo.

echo =====================================
echo 🔍 Diagnostic complete!
echo.
echo If you see any [ERROR] messages above, those need to be fixed.
echo If everything shows [OK], try running: npm run dev:simple
echo.
pause