#!/bin/bash

# OpenWispr Development Script
# This script sets up the development environment and starts all necessary processes

set -e

echo "🚀 Starting OpenWispr Development Environment"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or later."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

if ! command_exists python; then
    echo "❌ Python is not installed. Please install Python 3.8 or later."
    exit 1
fi

if ! command_exists pip; then
    echo "❌ pip is not installed. Please install pip."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Build Electron preload and main scripts
echo "🔨 Building Electron scripts..."
npx tsc electron/main.ts --outDir electron --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck
npx tsc electron/preload.ts --outDir electron --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck

echo "🎉 Development environment setup complete!"
echo ""
echo "To start the application in development mode, run:"
echo "  npm run electron:dev"
echo ""
echo "Or start components individually:"
echo "  Backend:  npm run backend:dev"
echo "  Frontend: npm run frontend:dev"
echo "  Electron: npm run electron"