# Quick Release Guide

## TL;DR - How to Release

```bash
# 1. Bump version (choose one)
npm run version:patch  # Bug fixes: 1.0.7 -> 1.0.8
npm run version:minor  # New features: 1.0.7 -> 1.1.0
npm run version:major  # Breaking changes: 1.0.7 -> 2.0.0

# 2. Commit and push
git add package.json
git commit -m "chore: bump version to 1.0.8"
git push origin main

# 3. Wait ~10-15 minutes for GitHub Actions to build
# 4. Check releases: https://github.com/Gustavo-Kuze/openwispr/releases
```

## What Happens Automatically

When you push to `main`:

1. ✅ **Builds** for Windows, macOS, and Linux
2. ✅ **Creates** a GitHub Release with tag `v{version}`
3. ✅ **Uploads** all installers (.exe, .zip, .deb, .rpm)
4. ✅ **Publishes** the release (not a draft)

## Files Generated

| Platform | Files |
|----------|-------|
| **Windows** | `OpenWispr-Setup-{version}.exe`<br>`OpenWispr-{version}-full.nupkg`<br>`openwispr-win32-x64-{version}.zip` |
| **macOS** | `openwispr-darwin-x64-{version}.zip` |
| **Linux** | `openwispr_{version}_amd64.deb`<br>`openwispr-{version}.x86_64.rpm` |

## Monitoring the Build

1. Go to: https://github.com/Gustavo-Kuze/openwispr/actions
2. Click the latest "Build and Release" workflow
3. Watch each platform build in parallel
4. Green checkmark = success ✅

## Troubleshooting

**Build failed?**
- Check the Actions logs for errors
- Common fixes:
  - Make sure all tests pass before pushing
  - Ensure package.json version is updated
  - Check for syntax errors in workflow file

**Release not appearing?**
- Wait a few minutes (builds take 10-15 min)
- Check the "create-release" job completed
- Verify `contents: write` permission is set

**Wrong version in release?**
- The version comes from `package.json`
- Make sure you committed the version bump

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.7 → 1.0.8): Bug fixes, no new features
- **Minor** (1.0.7 → 1.1.0): New features, backwards compatible
- **Major** (1.0.7 → 2.0.0): Breaking changes

## Advanced

For detailed information, see [.github/RELEASE_PROCESS.md](.github/RELEASE_PROCESS.md)
