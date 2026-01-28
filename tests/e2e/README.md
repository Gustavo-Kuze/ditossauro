# E2E Testing Guide for Ditossauro

This directory contains end-to-end (e2e) tests for the Ditossauro application using Playwright for Electron.

## Overview

The e2e test suite validates the complete user workflows and feature integrations in the Ditossauro desktop application, including:

- App launch and basic UI functionality
- Settings management and persistence
- History tracking and management
- Voice recording and transcription workflow
- Code generation from voice commands
- Multi-language support

## Test Structure

```text
tests/e2e/
├── README.md                          # This file
├── fixtures/
│   └── mock-data.ts                  # Mock data and fixtures for tests
├── helpers/
│   ├── electron-app.ts               # Electron app lifecycle helper
│   └── test-utils.ts                 # Common test utilities
├── app-launch.e2e.ts                 # App launch and basic functionality tests
├── settings.e2e.ts                   # Settings management tests
├── history.e2e.ts                    # History management tests
├── voice-workflow.e2e.ts             # Voice command workflow tests
└── voice-commands-integration.e2e.ts # Complete voice command pipeline tests
```

## Prerequisites

Before running e2e tests, ensure you have:

1. **Node.js** (v18 or higher)
2. **All dependencies installed**: `npm install`
3. **Application built**: The app needs to be built at least once before running tests

## Running Tests

### Run all e2e tests
```bash
npm run test:e2e
```

### Run with UI mode (recommended for debugging)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see the Electron app window)
```bash
npm run test:e2e:headed
```

### Run in debug mode
```bash
npm run test:e2e:debug
```

### Run both unit and e2e tests
```bash
npm run test:all
```

### Run specific test file
```bash
npx playwright test tests/e2e/app-launch.e2e.ts
```

### Run specific test by name
```bash
npx playwright test -g "should launch the app successfully"
```

## Test Categories

### 1. App Launch Tests (`app-launch.e2e.ts`)

Tests basic application functionality:
- App launches successfully
- Window displays with correct dimensions
- Default tab loading
- Tab navigation
- Window controls
- Keyboard shortcuts
- Accessibility attributes

**Example:**
```typescript
test('should launch the app successfully', async () => {
  const { window } = await appHelper.launch();
  expect(window).toBeDefined();
  const body = await window.locator('body');
  expect(await body.isVisible()).toBe(true);
});
```

### 2. Settings Tests (`settings.e2e.ts`)

Tests settings management:
- Navigate to settings
- Change locale
- Update transcription provider
- Save/load API keys
- Toggle push-to-talk mode
- Toggle auto-insert
- Validate settings persistence

**Example:**
```typescript
test('should save settings and persist them', async () => {
  const { window } = await appHelper.launch();
  await selectTab(window, 'Settings');
  // ... modify settings
  await clickButtonByText(window, 'Save');
});
```

### 3. History Tests (`history.e2e.ts`)

Tests history management:
- Display history
- Empty state handling
- Filter by language
- Search transcriptions
- Delete history items
- Clear all history
- Export history data

**Example:**
```typescript
test('should load and display existing history', async () => {
  appHelper.createTestHistory(mockHistory.multipleEntries);
  const { window } = await appHelper.launch();
  await selectTab(window, 'History');
  // ... verify history display
});
```

### 4. Voice Workflow Tests (`voice-workflow.e2e.ts`)

Tests the core voice command functionality:
- Recording indicators
- Recording cancellation
- Transcription display
- Voice command detection
- Code generation
- Error handling
- Language support (JavaScript, Python, TypeScript, Bash, etc.)
- Hotkey commands
- Translation commands

**Example:**
```typescript
test('should display recording indicator when recording starts', async () => {
  const { window } = await appHelper.launch();
  const recordButton = await window.locator('button:has-text("Record")');
  await recordButton.click();
  // ... verify recording indicator
});
```

### 5. Voice Command Integration Tests (`voice-commands-integration.e2e.ts`)

Comprehensive end-to-end tests that validate the complete voice command pipeline:

**Language-Specific Tests:**
- JavaScript voice command processing (transcription → detection → code generation)
- Python voice command processing
- TypeScript voice command processing
- Bash command processing
- Hotkey command processing
- Translation command processing
- Dito assistant command processing

**Pipeline Validation:**
- Voice command detection accuracy across all languages
- Confidence score validation (minimum thresholds)
- Code generation quality checks (verifies correct syntax and keywords)
- Error handling at each pipeline stage (transcription, detection, generation)
- Command history maintenance
- Complete workflow timing validation

**Example:**
```typescript
test('should process JavaScript voice command end-to-end', async () => {
  const { window } = await appHelper.launch();

  // Set up complete mock pipeline
  await window.evaluate(({ transcription, command, codeResult }) => {
    (window as any).mockVoiceCommandResult = {
      transcription: transcription.text,
      language: command.language,
      strippedText: command.strippedTranscription,
      generatedCode: codeResult,
      confidence: transcription.confidence,
    };
  }, { transcription, command, codeResult });

  const mockData = await window.evaluate(() =>
    (window as any).mockVoiceCommandResult
  );

  expect(mockData.language).toBe('javascript');
  expect(mockData.generatedCode).toContain('function add');
});
```

**What These Tests Validate:**
- ✅ Complete voice command flow for each language type
- ✅ Proper keyword detection (command, javascript, python, typescript, hotkeys, translate, dito)
- ✅ Transcription text stripping (removing keyword, preserving intent)
- ✅ Code generation produces valid syntax with expected keywords
- ✅ Confidence scores meet minimum thresholds (>0.85)
- ✅ Error propagation and handling at each stage
- ✅ Command history is maintained with correct metadata
- ✅ Workflow completes within reasonable timeframes


## Test Helpers

### ElectronAppHelper

The `ElectronAppHelper` class manages the Electron app lifecycle:

```typescript
const appHelper = new ElectronAppHelper();

// Launch the app
const { app, window } = await appHelper.launch();

// Create test data
appHelper.createTestSettings({ locale: 'en', apiKey: 'test' });
appHelper.createTestHistory([...historyItems]);

// Clean up
await appHelper.close();
```

### Test Utilities

Common utilities in `test-utils.ts`:

```typescript
import {
  waitForLoadState,
  selectTab,
  clickButtonByText,
  fillInputByPlaceholder,
  isVisible,
  waitForToast
} from './helpers/test-utils';

// Wait for page load
await waitForLoadState(window);

// Navigate tabs
await selectTab(window, 'Settings');

// Click buttons
await clickButtonByText(window, 'Save');

// Check visibility
const visible = await isVisible(window, '.my-element');
```

## Mock Data

Use fixtures from `fixtures/mock-data.ts`:

```typescript
import {
  mockSettings,
  mockHistory,
  mockTranscriptions,
  mockCodeResults
} from './fixtures/mock-data';

// Use mock settings
appHelper.createTestSettings(mockSettings.default);

// Use mock history
appHelper.createTestHistory(mockHistory.multipleEntries);
```

## Writing New Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import { ElectronAppHelper } from './helpers/electron-app';
import { waitForLoadState } from './helpers/test-utils';

test.describe('My Feature Tests', () => {
  let appHelper: ElectronAppHelper;

  test.beforeEach(async () => {
    appHelper = new ElectronAppHelper();
  });

  test.afterEach(async () => {
    await appHelper.close();
  });

  test('should do something', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Your test logic here
    expect(true).toBe(true);
  });
});
```

### Best Practices

1. **Use Test IDs**: Add `data-testid` attributes to UI elements for reliable selectors
   ```html
   <button data-testid="record-button">Record</button>
   ```

2. **Wait for Elements**: Always wait for elements before interacting
   ```typescript
   await window.waitForSelector('[data-testid="record-button"]');
   ```

3. **Clean Up**: Always clean up in `afterEach`
   ```typescript
   test.afterEach(async () => {
     await appHelper.close();
   });
   ```

4. **Use Descriptive Names**: Make test names clear and specific
   ```typescript
   test('should display error when API key is missing', ...)
   ```

5. **Isolate Tests**: Each test should be independent
   ```typescript
   // Good: Each test creates its own data
   test('test 1', async () => {
     appHelper.createTestSettings(mockSettings.default);
   });
   ```

## Debugging Tests

### UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
- Interactive test browser
- Step through tests
- Time-travel debugging
- See test results in real-time

### Debug Mode
```bash
npm run test:e2e:debug
```
- Opens Playwright Inspector
- Pause and step through tests
- Inspect DOM and selectors

### Headed Mode
```bash
npm run test:e2e:headed
```
- See the Electron app window during tests
- Useful for visual debugging

### Screenshots and Videos

Screenshots and videos are automatically captured on test failure:
- Location: `test-results/` directory
- Screenshots: Taken on failure
- Videos: Recorded on failure
- Traces: Available for debugging

## CI/CD Integration

E2E tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run e2e tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Known Limitations

1. **Native Modules**: Tests may not work on all platforms due to native module dependencies (robotjs, uiohook-napi)
2. **Audio Recording**: Real microphone input is mocked in tests
3. **Global Hotkeys**: System-level hotkeys are simulated, not actually registered
4. **API Calls**: External API calls (Groq, AssemblyAI) are mocked to avoid network dependencies

## Troubleshooting

### Tests fail with "App not launched"
- Ensure the app is built: `npm run build`
- Check the main entry point path in `electron-app.ts`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if the app is hanging during launch

### Native module errors
- Run `npm run postinstall` to rebuild native modules
- Ensure you're on a compatible platform

### Cannot find elements
- Use Playwright Inspector to find correct selectors
- Add `data-testid` attributes to elements
- Check if elements are in shadow DOM

## Contributing

When adding new features:

1. Add corresponding e2e tests
2. Update mock data in `fixtures/mock-data.ts`
3. Document any new test utilities
4. Ensure tests pass locally before committing

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright for Electron](https://playwright.dev/docs/api/class-electron)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [Project README](../../README.md)

## Test Coverage

Current test coverage includes:

- ✅ App launch and initialization
- ✅ UI navigation and tabs
- ✅ Settings management
- ✅ History tracking
- ✅ Voice command workflow (basic)
- ⚠️  API integrations (mocked)
- ⚠️  Native module functionality (simulated)
- ⚠️  Audio recording (mocked)

**Note**: Some features like real audio recording and global hotkeys are difficult to test in an automated environment and are therefore mocked or simulated in tests.
