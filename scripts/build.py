#!/usr/bin/env python3
"""
Build script for OpenWispr
Builds the application for production distribution
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and handle errors."""
    print(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, cwd=cwd, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False

def main():
    """Main build process."""
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    print("🚀 Building OpenWispr...")
    print(f"Project root: {project_root}")
    
    # Check if required tools are installed
    print("\n📋 Checking prerequisites...")
    
    # Check Node.js
    if not run_command(["node", "--version"]):
        print("❌ Node.js is not installed or not in PATH")
        return False
    
    # Check Python
    if not run_command(["python3", "--version"]):
        print("❌ Python 3 is not installed or not in PATH")
        return False
    
    # Check Rust/Cargo
    if not run_command(["cargo", "--version"]):
        print("❌ Rust/Cargo is not installed or not in PATH")
        return False
    
    # Install frontend dependencies
    print("\n📦 Installing frontend dependencies...")
    if not run_command(["npm", "install"], cwd="frontend"):
        print("❌ Failed to install frontend dependencies")
        return False
    
    # Install backend dependencies
    print("\n🐍 Installing backend dependencies...")
    if not run_command(["pip3", "install", "-r", "requirements.txt"], cwd="backend"):
        print("❌ Failed to install backend dependencies")
        return False
    
    # Build the application
    print("\n🔨 Building application...")
    if not run_command(["npm", "run", "tauri", "build"]):
        print("❌ Failed to build application")
        return False
    
    print("\n✅ Build completed successfully!")
    print("📁 Check the 'src-tauri/target/release/bundle' directory for the built application")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)