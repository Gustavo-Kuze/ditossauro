@echo off
REM Test script for OpenWispr Python backend on Windows

echo Testing OpenWispr Python Backend
echo =================================

echo [INFO] Testing Python backend directly...

REM Test with python command
echo [TEST] Testing with 'python' command:
python backend\main.py check_microphone
echo.

echo [TEST] Testing with 'python3' command:
python3 backend\main.py check_microphone 2>nul
echo.

echo [TEST] Testing models command:
python backend\main.py get_models
echo.

echo [INFO] Testing with test script:
python test_backend.py

pause
