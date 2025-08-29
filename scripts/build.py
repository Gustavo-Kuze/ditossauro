#!/usr/bin/env python3
"""
OpenWispr Build Script
Builds the application for distribution
"""

import os
import sys
import subprocess
import shutil
import platform
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a command and handle errors"""
    print(f"🔨 Running: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=check,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_prerequisites():
    """Check if all required tools are installed"""
    print("📋 Checking prerequisites...")
    
    required_commands = ['node', 'npm', 'python', 'pip']
    
    for cmd in required_commands:
        try:
            subprocess.run([cmd, '--version'], 
                         capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"❌ {cmd} is not installed or not in PATH")
            return False
    
    print("✅ Prerequisites check passed")
    return True

def install_dependencies():
    """Install all dependencies"""
    print("📦 Installing dependencies...")
    
    # Root dependencies
    run_command("npm install")
    
    # Frontend dependencies
    run_command("npm install", cwd="frontend")
    
    # Backend dependencies
    run_command("pip install -r requirements.txt", cwd="backend")

def build_typescript():
    """Build TypeScript files"""
    print("🔨 Building TypeScript...")
    
    # Build main process
    run_command(
        "npx tsc electron/main.ts --outDir electron --target es2020 "
        "--module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck"
    )
    
    # Build preload script
    run_command(
        "npx tsc electron/preload.ts --outDir electron --target es2020 "
        "--module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck"
    )

def build_frontend():
    """Build the React frontend"""
    print("🔨 Building frontend...")
    run_command("npm run build", cwd="frontend")

def build_electron():
    """Build the Electron application"""
    print("🔨 Building Electron application...")
    
    # Determine the target platform
    current_platform = platform.system().lower()
    
    if current_platform == "darwin":
        target = "--mac"
    elif current_platform == "windows":
        target = "--win"
    else:
        target = "--linux"
    
    run_command(f"npx electron-builder {target}")

def create_assets():
    """Create or copy required assets"""
    print("🎨 Setting up assets...")
    
    assets_dir = Path("assets")
    assets_dir.mkdir(exist_ok=True)
    
    # Create a simple icon if it doesn't exist
    icon_path = assets_dir / "icon.png"
    if not icon_path.exists():
        print("⚠️  No icon found. You should add an icon.png file in the assets directory.")
    
    # Create overlay assets directory
    overlay_dir = assets_dir / "overlay"
    overlay_dir.mkdir(exist_ok=True)

def clean_build():
    """Clean build artifacts"""
    print("🧹 Cleaning build artifacts...")
    
    dirs_to_clean = [
        "dist",
        "frontend/build",
        "electron/main.js",
        "electron/preload.js"
    ]
    
    for dir_path in dirs_to_clean:
        path = Path(dir_path)
        if path.is_file():
            path.unlink()
            print(f"Removed file: {dir_path}")
        elif path.is_dir():
            shutil.rmtree(path)
            print(f"Removed directory: {dir_path}")

def main():
    """Main build process"""
    print("🚀 Starting OpenWispr Build Process")
    print(f"Platform: {platform.system()}")
    print()
    
    # Parse command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == "clean":
        clean_build()
        return
    
    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Create assets
    create_assets()
    
    # Install dependencies
    install_dependencies()
    
    # Build TypeScript
    build_typescript()
    
    # Build frontend
    build_frontend()
    
    # Build Electron app
    build_electron()
    
    print()
    print("🎉 Build completed successfully!")
    print("📁 Built application can be found in the 'dist' directory")

if __name__ == "__main__":
    main()