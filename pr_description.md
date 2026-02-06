# Fix: Preserve clipboard image when using translate command

## Problem
When using the translate command with selected text while an image was already copied to the clipboard, the image was lost after the translation was inserted. The clipboard would contain only the translated text, and the original image would be gone.

## Root Cause
There were two main issues:

1. **Incomplete clipboard backup**: `ContextManager.backupClipboard()` only backed up the `text/plain` format. When the clipboard contained an image (e.g., `image/png`), it was not stored in the backup.

2. **Incomplete clipboard restoration**: `ContextManager.restoreClipboard()` only restored text content using `clipboard.writeText()`, which doesn't restore images or other formats.

3. **Timing issue**: `ContextManager.restoreClipboard()` was called with a `setTimeout(() => ..., 200)` delay. This created a race condition where `TextInserter.insertText()` could backup the clipboard before it was restored, capturing the wrong content (selected text instead of the original image).

## Solution
### 1. Enhanced clipboard backup to support all formats
Updated `ContextManager.backupClipboard()` to:
- Detect all available clipboard formats using `clipboard.availableFormats()`
- Iterate through each format and backup its content
- Store all format-data pairs in a `Map` for later restoration
- Support common formats: `text/plain`, `text/html`, `image/png`, `image/jpeg`, and custom formats

### 2. Enhanced clipboard restoration for all formats
Updated `ContextManager.restoreClipboard()` to:
- Iterate through the stored format-data pairs
- Use appropriate read methods based on format type (`readImage()`, `readBuffer()`, etc.)
- Build a write data object with `text`, `html`, and `image` properties
- Use `clipboard.write()` to restore all formats at once
- For custom formats, use `clipboard.writeBuffer()` separately
- Added comprehensive error handling and logging

### 3. Fixed restore timing
Changed `ContextManager.restoreClipboard()` call in `src/main.ts` from:
```typescript
setTimeout(() => {
  ContextManager.restoreClipboard();
}, 200);
```
To:
```typescript
ContextManager.restoreClipboard();
```

This ensures the clipboard is restored immediately after context capture, before `TextInserter.insertText()` backs up the clipboard. This guarantees that `TextInserter` backups up the original clipboard content (including the image).

## Files Changed
- `src/context-manager.ts`: Updated `backupClipboard()` and `restoreClipboard()` methods
- `src/main.ts`: Fixed `ContextManager.restoreClipboard()` call timing

## Testing
All existing tests pass:
- 186 tests across 8 test files
- Verified clipboard backup and restoration with multiple formats
- Verified image preservation during translate command workflow

## Behavior Changes
**Before**: Clipboard image was lost after using translate command with selected text.

**After**: Clipboard image is correctly restored after translation is complete. The clipboard contains all original formats (text, images, etc.) after the operation.
