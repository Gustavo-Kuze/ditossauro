#!/usr/bin/env node

/**
 * Cross-platform build script for OpenWispr
 * Automatically detects the operating system and runs the appropriate script
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

function runScript() {
    const platform = os.platform();
    let command;
    let args = [];

    if (platform === 'win32') {
        // Windows
        command = path.join(__dirname, 'build.bat');
        console.log('🪟 Detected Windows - using build.bat');
    } else {
        // Unix-like (Linux, macOS)
        command = 'python3';
        args = [path.join(__dirname, 'build.py')];
        console.log('🐧 Detected Unix-like system - using build.py');
    }

    console.log(`Running: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
        stdio: 'inherit',
        shell: platform === 'win32',
        cwd: path.dirname(__dirname) // Project root
    });

    child.on('error', (error) => {
        console.error('❌ Failed to start build script:', error.message);
        
        if (platform === 'win32') {
            console.log('\n💡 Alternative: Try running directly:');
            console.log('   scripts\\build.bat');
        } else {
            console.log('\n💡 Alternative: Try running directly:');
            console.log('   python3 scripts/build.py');
            console.log('   or: npm run tauri build');
        }
        
        process.exit(1);
    });

    child.on('exit', (code) => {
        process.exit(code);
    });
}

runScript();