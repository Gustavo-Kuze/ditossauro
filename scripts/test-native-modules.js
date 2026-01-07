#!/usr/bin/env node

/**
 * Test script to verify native modules are properly loaded
 * Run with: node scripts/test-native-modules.js
 */

console.log('🧪 Testing Native Modules\n');
console.log('='.repeat(60));

// Test 1: uiohook-napi
console.log('\n1️⃣  Testing uiohook-napi...');
try {
  const uiohook = require('uiohook-napi');
  console.log('   ✅ uiohook-napi loaded successfully');
  console.log('   📦 Module path:', require.resolve('uiohook-napi'));

  // Check if key methods exist
  if (typeof uiohook.on === 'function') {
    console.log('   ✅ Event listener method exists');
  }
  if (typeof uiohook.start === 'function') {
    console.log('   ✅ Start method exists');
  }
  if (typeof uiohook.stop === 'function') {
    console.log('   ✅ Stop method exists');
  }
} catch (error) {
  console.log('   ❌ Failed to load uiohook-napi');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Test 2: robotjs
console.log('\n2️⃣  Testing robotjs...');
try {
  const robot = require('robotjs');
  console.log('   ✅ robotjs loaded successfully');
  console.log('   📦 Module path:', require.resolve('robotjs'));

  // Check if key methods exist
  if (typeof robot.keyTap === 'function') {
    console.log('   ✅ keyTap method exists');
  }
  if (typeof robot.typeString === 'function') {
    console.log('   ✅ typeString method exists');
  }
  if (typeof robot.getMousePos === 'function') {
    console.log('   ✅ getMousePos method exists');
  }
} catch (error) {
  console.log('   ❌ Failed to load robotjs');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Test 3: Check for .node files
console.log('\n3️⃣  Checking for compiled .node files...');
const fs = require('fs');
const path = require('path');

function findNodeFiles(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findNodeFiles(fullPath));
      } else if (entry.name.endsWith('.node')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors (permission denied, etc.)
  }
  return files;
}

const uiohookPath = path.dirname(require.resolve('uiohook-napi'));
const robotPath = path.dirname(require.resolve('robotjs'));

const uiohookNodeFiles = findNodeFiles(uiohookPath);
const robotNodeFiles = findNodeFiles(robotPath);

console.log(`   📁 uiohook-napi .node files: ${uiohookNodeFiles.length}`);
uiohookNodeFiles.forEach(file => console.log(`      - ${path.relative(process.cwd(), file)}`));

console.log(`   📁 robotjs .node files: ${robotNodeFiles.length}`);
robotNodeFiles.forEach(file => console.log(`      - ${path.relative(process.cwd(), file)}`));

if (uiohookNodeFiles.length === 0) {
  console.log('   ⚠️  Warning: No .node files found for uiohook-napi');
  console.log('   💡 Try running: npm run postinstall');
}

if (robotNodeFiles.length === 0) {
  console.log('   ⚠️  Warning: No .node files found for robotjs');
  console.log('   💡 Try running: npm run postinstall');
}

// Test 4: Platform check
console.log('\n4️⃣  Platform Information...');
console.log(`   🖥️  Platform: ${process.platform}`);
console.log(`   🏗️  Architecture: ${process.arch}`);
console.log(`   📌 Node.js version: ${process.version}`);
console.log(`   ⚡ Electron: ${process.versions.electron || 'Not running in Electron'}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ All native modules loaded successfully!');
console.log('\n💡 If running in production, ensure:');
console.log('   1. Modules are unpacked from asar (forge.config.ts)');
console.log('   2. electron-rebuild was run for the correct Electron version');
console.log('   3. Build tools are installed (Windows: Visual Studio Build Tools)');
console.log('');
