# Release Process

This document describes how to create a new release of OpenWispr.

## Automatic Releases via GitHub Actions

The project is configured with a GitHub Actions workflow that automatically builds and publishes releases when you push to the `main` branch.

### How it Works

1. **Trigger**: Push to `main` branch triggers the workflow
2. **Build**: Builds the app for Windows, macOS, and Linux in parallel
3. **Release**: Creates a GitHub Release with all built artifacts
4. **Tag**: Uses the version from `package.json` as the release tag (e.g., `v1.0.7`)

### Supported Platforms

- **Windows**:
  - `.exe` installer (Squirrel)
  - `.nupkg` package
  - `.zip` archive

- **macOS**:
  - `.zip` archive

- **Linux**:
  - `.deb` package (Debian/Ubuntu)
  - `.rpm` package (Fedora/RHEL)

## Creating a New Release

### Method 1: Using npm scripts (Recommended)

1. **Bump the version** using one of these commands:
   ```bash
   npm run version:patch  # 1.0.7 -> 1.0.8 (bug fixes)
   npm run version:minor  # 1.0.7 -> 1.1.0 (new features)
   npm run version:major  # 1.0.7 -> 2.0.0 (breaking changes)
   ```

2. **Review the change**:
   ```bash
   git diff package.json
   ```

3. **Commit and push**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.8"
   git push origin main
   ```

4. **Wait for GitHub Actions** to build and create the release (takes ~10-15 minutes)

5. **Check the release**: Visit https://github.com/Gustavo-Kuze/openwispr/releases

### Method 2: Manual version bump

1. **Edit `package.json`** and update the `version` field:
   ```json
   {
     "version": "1.0.8"
   }
   ```

2. **Commit and push**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.8"
   git push origin main
   ```

## Workflow Details

The workflow (`.github/workflows/release.yml`) performs these steps:

1. **Checkout**: Checks out the repository code
2. **Setup**: Installs Node.js 20 and Python 3.11
3. **Install**: Runs `npm ci` to install dependencies
4. **Build**: Runs `npm run make` to build the Electron app
5. **Upload**: Uploads build artifacts for each platform
6. **Release**: Creates a GitHub Release with all artifacts

## Monitoring the Build

1. Go to the **Actions** tab in your GitHub repository
2. Click on the latest "Build and Release" workflow run
3. Monitor the progress of each platform build
4. Check for any errors in the build logs

## Troubleshooting

### Build fails on a specific platform

- Check the Actions log for that platform
- Common issues:
  - Missing dependencies (install them in the workflow)
  - Native module compilation failures (ensure Python is installed)
  - Code signing issues on macOS (requires Apple Developer certificate)

### Release not created

- Ensure the workflow has `contents: write` permission
- Check that `GITHUB_TOKEN` is available (it's automatic)
- Verify the `create-release` job ran successfully

### Wrong version in release

- The version comes from `package.json`
- Make sure you committed the version bump before pushing

## Release Notes

The release notes are automatically generated from the workflow. To customize them:

1. Edit `.github/workflows/release.yml`
2. Update the `body` section in the "Create Release" step
3. Commit and push the changes

## Security Considerations

- **Code Signing**: For production releases, consider adding code signing
  - Windows: Sign with a valid certificate
  - macOS: Notarize the app with Apple
- **Secrets**: Never commit API keys or secrets to the repository
- **Permissions**: The workflow only has `contents: write` permission

## Future Improvements

Potential enhancements to the release process:

- [ ] Add automatic changelog generation from commit messages
- [ ] Add code signing for Windows and macOS
- [ ] Add automated testing before release
- [ ] Add release candidates (pre-releases)
- [ ] Add delta updates for faster downloads
- [ ] Add auto-update functionality in the app
