#!/usr/bin/env node

/**
 * Script to bump version in package.json
 * Usage:
 *   node scripts/bump-version.js patch  # 1.0.7 -> 1.0.8
 *   node scripts/bump-version.js minor  # 1.0.7 -> 1.1.0
 *   node scripts/bump-version.js major  # 1.0.7 -> 2.0.0
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const versionType = process.argv[2] || 'patch';
const currentVersion = packageJson.version;

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

const newVersion = bumpVersion(currentVersion, versionType);

packageJson.version = newVersion;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version bumped: ${currentVersion} -> ${newVersion}`);
console.log(`📝 Updated package.json`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. Review the changes: git diff package.json`);
console.log(`   2. Commit: git add package.json && git commit -m "chore: bump version to ${newVersion}"`);
console.log(`   3. Push to main: git push origin main`);
console.log(`   4. GitHub Actions will automatically build and release v${newVersion}`);
