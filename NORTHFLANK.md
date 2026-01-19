# NorthFlank Deployment Guide

This guide explains how to build and publish Ditossauro releases using NorthFlank.

## Overview

The project is configured to:
1. Build the Electron application in NorthFlank's Docker environment
2. Create platform-specific installers (DEB and RPM for Linux)
3. Automatically publish releases to GitHub when a build completes

## Setup Instructions

### 1. Create a GitHub Personal Access Token

You need a GitHub token with permissions to create releases and upload assets.

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "NorthFlank Releases"
4. Select the following permissions:
   - `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token** - you won't be able to see it again!

### 2. Configure NorthFlank Build Arguments

In your NorthFlank project settings, add the following **build arguments**:

| Argument | Required | Description | Example |
|----------|----------|-------------|---------|
| `GITHUB_TOKEN` | **Yes** | GitHub personal access token for publishing releases | `ghp_xxxxxxxxxxxx` |
| `RELEASE_TAG` | No | Custom tag for the release (defaults to `v{version}` from package.json) | `v1.0.20` |
| `RELEASE_DRAFT` | No | Set to `true` to create a draft release | `false` |
| `RELEASE_PRERELEASE` | No | Set to `true` to mark as prerelease | `false` |

#### How to Add Build Arguments in NorthFlank:

1. Go to your NorthFlank project
2. Navigate to the build service settings
3. Find the "Build Arguments" or "Environment Variables" section
4. Add the build arguments listed above
5. **Important**: Mark `GITHUB_TOKEN` as **secret** to keep it secure

### 3. Trigger a Build

Once configured, any build in NorthFlank will:

1. Install dependencies and native modules
2. Build the Electron application
3. Create installer packages (`.deb` and `.rpm` for Linux)
4. **Automatically publish to GitHub Releases** (if `GITHUB_TOKEN` is set)

### 4. Verify the Release

After the build completes:

1. Go to your GitHub repository
2. Click on "Releases" in the right sidebar
3. You should see a new release with the version from `package.json`
4. The release will include the built installers as downloadable assets

## GitHub Actions (Disabled)

The GitHub Actions workflow for building and releasing has been **disabled** but not removed. The workflow files remain in `.github/workflows/` for reference.

To re-enable GitHub Actions builds:
1. Open `.github/workflows/release.yml`
2. Remove the `if: false` conditions from the jobs
3. Commit the changes

## Build Artifacts

The NorthFlank build creates the following artifacts:

- **DEB Package** (Debian/Ubuntu): `out/make/deb/x64/*.deb`
- **RPM Package** (RedHat/Fedora): `out/make/rpm/x64/*.rpm`

These are automatically uploaded to GitHub Releases when `GITHUB_TOKEN` is configured.

## Troubleshooting

### Build Fails with "GITHUB_TOKEN not set"

This is just a warning - the build will continue but won't publish to GitHub. To enable publishing, add the `GITHUB_TOKEN` build argument in NorthFlank.

### Release Already Exists

The publish script will update existing releases with the same tag instead of failing. If you want to create a new release, bump the version in `package.json` first.

### No Artifacts Found

If the publish script reports "No artifacts found", check:
1. The build completed successfully (`npm run make` didn't fail)
2. The `out/make/` directory contains `.deb` or `.rpm` files
3. Check the build logs for errors during the package creation step

### Permission Denied on GitHub API

Make sure your `GITHUB_TOKEN` has the `repo` scope enabled. You may need to regenerate the token with the correct permissions.

## Manual Release Publishing

If you need to manually publish a release from a local build:

```bash
# Build the application
npm run make

# Set environment variables
export GITHUB_TOKEN="your_github_token"
export RELEASE_TAG="v1.0.20"  # optional

# Run the publish script
node scripts/publish-release.js
```

## Version Management

To bump the version before creating a release:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm run version:patch

# Minor version (1.0.0 -> 1.1.0)
npm run version:minor

# Major version (1.0.0 -> 2.0.0)
npm run version:major
```

After bumping the version, commit and push to trigger a new NorthFlank build with the updated version.

## Security Notes

- **Never commit your GitHub token** to the repository
- Store the token securely in NorthFlank's build arguments
- Mark the token as "secret" in NorthFlank to prevent it from appearing in logs
- Rotate the token periodically for security
- Use a token with minimal required permissions (only `repo` scope)

## Support

For issues with:
- **NorthFlank builds**: Check NorthFlank build logs and documentation
- **GitHub releases**: Check the publish script output in build logs
- **Application bugs**: Open an issue in the GitHub repository
