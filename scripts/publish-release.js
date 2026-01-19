#!/usr/bin/env node

/**
 * Publish GitHub Release from NorthFlank Build
 *
 * This script creates a GitHub release and uploads build artifacts.
 *
 * Required environment variables:
 * - GITHUB_TOKEN: GitHub personal access token with repo permissions
 * - GITHUB_REPOSITORY: Repository in format "owner/repo" (defaults to Gustavo-Kuze/ditossauro)
 *
 * Optional environment variables:
 * - RELEASE_TAG: Custom tag for the release (defaults to v{version} from package.json)
 * - RELEASE_DRAFT: Set to 'true' to create a draft release (defaults to false)
 * - RELEASE_PRERELEASE: Set to 'true' to mark as prerelease (defaults to false)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'Gustavo-Kuze/ditossauro';
const [OWNER, REPO] = GITHUB_REPOSITORY.split('/');

// Read package.json for version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const VERSION = packageJson.version;
const TAG_NAME = process.env.RELEASE_TAG || `v${VERSION}`;
const IS_DRAFT = process.env.RELEASE_DRAFT === 'true';
const IS_PRERELEASE = process.env.RELEASE_PRERELEASE === 'true';

// Artifact paths - adjust based on your build output
const ARTIFACT_DIR = path.join(__dirname, '../out/make');

console.log('📦 GitHub Release Publisher');
console.log('==========================');
console.log(`Repository: ${GITHUB_REPOSITORY}`);
console.log(`Version: ${VERSION}`);
console.log(`Tag: ${TAG_NAME}`);
console.log(`Draft: ${IS_DRAFT}`);
console.log(`Prerelease: ${IS_PRERELEASE}`);
console.log('');

// Validate environment
if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

if (!fs.existsSync(ARTIFACT_DIR)) {
  console.error(`❌ Error: Artifact directory not found: ${ARTIFACT_DIR}`);
  console.error('   Make sure to run "npm run package" or "npm run make" before publishing');
  process.exit(1);
}

/**
 * Make a GitHub API request
 */
function githubRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'User-Agent': 'ditossauro-release-publisher',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`GitHub API error (${res.statusCode}): ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Upload a file to a GitHub release
 */
function uploadReleaseAsset(uploadUrl, filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    const fileStream = fs.createReadStream(filePath);

    // Parse upload URL and prepare for file upload
    const url = uploadUrl.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`);
    const urlObj = new URL(url);

    console.log(`   Uploading ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'User-Agent': 'ditossauro-release-publisher',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize,
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`   ✅ Uploaded ${fileName}`);
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Upload failed (${res.statusCode}): ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    fileStream.pipe(req);
  });
}

/**
 * Find all artifacts to upload
 */
function findArtifacts() {
  const artifacts = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        // Include common installer/package file types
        const ext = path.extname(file).toLowerCase();
        if (['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.zip', '.tar.gz', '.appimage', '.nupkg'].includes(ext)) {
          artifacts.push(filePath);
        }
      }
    }
  }

  walkDir(ARTIFACT_DIR);
  return artifacts;
}

/**
 * Main release process
 */
async function publishRelease() {
  try {
    // Step 1: Check if release already exists
    console.log('🔍 Checking for existing release...');
    let release;
    try {
      release = await githubRequest('GET', `/repos/${OWNER}/${REPO}/releases/tags/${TAG_NAME}`);
      console.log(`ℹ️  Release ${TAG_NAME} already exists, will update it`);
    } catch (error) {
      console.log('✨ Creating new release...');

      // Step 2: Create the release
      release = await githubRequest('POST', `/repos/${OWNER}/${REPO}/releases`, {
        tag_name: TAG_NAME,
        name: `Release ${TAG_NAME}`,
        body: `## Ditossauro ${TAG_NAME}

### What's New
- Bug fixes and performance improvements

### Downloads
Download the appropriate installer for your operating system below.

### Installation
1. Download the installer for your operating system
2. Run the installer
3. Configure your Groq API key in settings
4. Set up your hotkeys and start transcribing!

For more information, see the [README](https://github.com/${GITHUB_REPOSITORY}/blob/main/README.md).`,
        draft: IS_DRAFT,
        prerelease: IS_PRERELEASE,
      });

      console.log(`✅ Created release: ${release.html_url}`);
    }

    // Step 3: Find artifacts
    console.log('\n📁 Finding artifacts...');
    const artifacts = findArtifacts();

    if (artifacts.length === 0) {
      console.warn('⚠️  Warning: No artifacts found to upload');
      console.warn(`   Looked in: ${ARTIFACT_DIR}`);
      console.warn('   Expected file types: .exe, .msi, .dmg, .pkg, .deb, .rpm, .zip, .tar.gz, .appimage, .nupkg');
    } else {
      console.log(`Found ${artifacts.length} artifact(s):`);
      artifacts.forEach(a => console.log(`   - ${path.relative(ARTIFACT_DIR, a)}`));
    }

    // Step 4: Upload artifacts
    if (artifacts.length > 0) {
      console.log('\n📤 Uploading artifacts...');
      for (const artifact of artifacts) {
        await uploadReleaseAsset(release.upload_url, artifact);
      }
    }

    // Success!
    console.log('\n🎉 Release published successfully!');
    console.log(`   URL: ${release.html_url}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error publishing release:', error.message);
    process.exit(1);
  }
}

// Run the publisher
publishRelease();
