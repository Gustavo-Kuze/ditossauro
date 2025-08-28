#!/bin/bash

# Development script for OpenWispr
# Sets up the development environment and starts the application

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Starting OpenWispr in development mode..."
echo "Project root: $PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed or not in PATH"
    exit 1
fi

# Check Rust/Cargo
if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo is not installed or not in PATH"
    print_error "Please install Rust from https://rustup.rs/"
    exit 1
fi

# Check Tauri CLI
if ! command -v cargo tauri &> /dev/null; then
    print_warning "Tauri CLI not found, installing..."
    cargo install tauri-cli
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Install backend dependencies if needed
if ! python3 -c "import faster_whisper" 2>/dev/null; then
    print_status "Installing backend dependencies..."
    cd backend
    pip3 install -r requirements.txt
    cd ..
fi

# Create a Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
else
    print_status "Activating Python virtual environment..."
    source venv/bin/activate
fi

# Start the development server
print_status "Starting development server..."
print_status "The application will open in a new window"
print_status "Press Ctrl+C to stop the development server"

# Run in development mode
npm run tauri dev