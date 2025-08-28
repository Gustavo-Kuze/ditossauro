#!/usr/bin/env node

/**
 * Cross-platform development script for OpenWispr
 * Automatically detects the operating system and runs the appropriate script
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

function runScript() {
    const platform = os.platform();
    let scriptPath;
    let scriptArgs = [];

    if (platform === 'win32') {
        // Windows
        scriptPath = path.join(__dirname, 'dev.bat');
        console.log('🪟 Detected Windows - using dev.bat');
    } else {
        // Unix-like (Linux, macOS)
        scriptPath = path.join(__dirname, 'dev.sh');
        console.log('🐧 Detected Unix-like system - using dev.sh');
        
        // Make sure the script is executable
        const fs = require('fs');
        try {
            fs.chmodSync(scriptPath, '755');
        } catch (error) {
            console.warn('Warning: Could not make dev.sh executable:', error.message);
        }
    }

    console.log(`Running: ${scriptPath}`);

    const child = spawn(scriptPath, scriptArgs, {
        stdio: 'inherit',
        shell: platform === 'win32',
        cwd: path.dirname(__dirname) // Project root
    });

    child.on('error', (error) => {
        console.error('❌ Failed to start development script:', error.message);
        
        if (platform === 'win32') {
            console.log('\n💡 Alternative: Try running directly:');
            console.log('   scripts\\dev.bat');
        } else {
            console.log('\n💡 Alternative: Try running directly:');
            console.log('   ./scripts/dev.sh');
            console.log('   or: npm run tauri dev');
        }
        
        process.exit(1);
    });

    child.on('exit', (code) => {
        process.exit(code);
    });
}

runScript();