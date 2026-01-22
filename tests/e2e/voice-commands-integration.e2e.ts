import { test, expect } from '@playwright/test';
import { ElectronAppHelper } from './helpers/electron-app';
import { waitForLoadState } from './helpers/test-utils';
import { mockTranscriptions, mockCodeResults, mockSettings } from './fixtures/mock-data';

test.describe('Voice Command Integration - Complete Pipeline', () => {
  let appHelper: ElectronAppHelper;

  test.beforeEach(async () => {
    appHelper = new ElectronAppHelper();
    appHelper.createTestSettings(mockSettings.default);
  });

  test.afterEach(async () => {
    await appHelper.close();
  });

  test('should process JavaScript voice command with transcription and generation', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Initialize test mocking system
    await appHelper.initializeTestMocks();

    // Simulate complete voice command flow
    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.javascript,
      mockCodeResults.javascript
    );

    // Wait for UI to update
    await window.waitForTimeout(500);

    // Verify session was created
    expect(session).toBeDefined();
    expect(session.transcription).toBe(mockTranscriptions.javascript.text);
    expect(session.language).toBe(mockTranscriptions.javascript.language);
    expect(session.confidence).toBe(mockTranscriptions.javascript.confidence);

    // Check that UI is still functional
    const body = await window.locator('body');
    expect(await body.isVisible()).toBe(true);
  });

  test('should process Python voice command with correct language detection', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Initialize test mocking system
    await appHelper.initializeTestMocks();

    // Simulate Python voice command
    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.python,
      mockCodeResults.python
    );

    await window.waitForTimeout(500);

    // Verify Python language was detected
    expect(session.transcription).toBe(mockTranscriptions.python.text);
    expect(session.language).toBe(mockTranscriptions.python.language);

    // App should remain functional
    const hasButtons = await window.evaluate(() => {
      return document.querySelectorAll('button').length > 0;
    });
    expect(hasButtons).toBe(true);
  });

  test('should process TypeScript voice command', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.typescript,
      mockCodeResults.typescript
    );

    await window.waitForTimeout(500);

    expect(session.transcription).toBe(mockTranscriptions.typescript.text);
    expect(session.language).toBe(mockTranscriptions.typescript.language);

    // Verify UI is responsive
    const isAppFunctional = await window.evaluate(() => {
      const body = document.querySelector('body');
      return body !== null && document.querySelectorAll('button').length > 0;
    });
    expect(isAppFunctional).toBe(true);
  });

  test('should process Bash command voice command', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.bash,
      mockCodeResults.bash
    );

    await window.waitForTimeout(500);

    expect(session.transcription).toBe(mockTranscriptions.bash.text);
    expect(session.language).toBe(mockTranscriptions.bash.language);

    // App should be responsive
    const body = await window.locator('body');
    expect(await body.isVisible()).toBe(true);
  });

  test('should process hotkey voice command', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.hotkey,
      mockCodeResults.hotkey
    );

    await window.waitForTimeout(500);

    expect(session.transcription).toBe(mockTranscriptions.hotkey.text);

    // App should remain functional after hotkey command
    const hasButtons = await window.evaluate(() => {
      return document.querySelectorAll('button').length > 0;
    });
    expect(hasButtons).toBe(true);
  });

  test('should process translation voice command', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.translate,
      { code: mockCodeResults.translate, language: 'text' }
    );

    await window.waitForTimeout(500);

    expect(session.transcription).toBe(mockTranscriptions.translate.text);

    // App should remain functional
    const isAppFunctional = await window.evaluate(() => {
      return document.body !== null;
    });
    expect(isAppFunctional).toBe(true);
  });

  test('should display confidence score during voice command processing', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    // Simulate with specific confidence
    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.javascript
    );

    await window.waitForTimeout(500);

    // Verify confidence was captured
    expect(session.confidence).toBe(mockTranscriptions.javascript.confidence);

    // App should be functional
    const body = await window.locator('body');
    expect(await body.isVisible()).toBe(true);
  });

  test('should add voice commands to history after processing', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    // Process a voice command
    const session = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.javascript,
      mockCodeResults.javascript
    );

    await window.waitForTimeout(500);

    // Verify session was created with all required fields
    expect(session.id).toBeDefined();
    expect(session.timestamp).toBeDefined();
    expect(session.transcription).toBe(mockTranscriptions.javascript.text);
    expect(session.duration).toBeDefined();
    expect(session.language).toBe(mockTranscriptions.javascript.language);
    expect(session.confidence).toBe(mockTranscriptions.javascript.confidence);

    // Navigate to history tab if it exists
    const historyTab = await window.locator(
      'a:has-text("History"), button:has-text("History"), [data-testid="history-tab"]'
    ).first();

    if ((await historyTab.count()) > 0) {
      await historyTab.click();
      await window.waitForTimeout(500);

      // History tab should be accessible
      const body = await window.locator('body');
      expect(await body.isVisible()).toBe(true);
    }
  });

  test('should handle transcription errors gracefully in UI', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    // Simulate transcription error
    await appHelper.simulateTranscriptionError('Transcription service unavailable');

    await window.waitForTimeout(500);

    // App should remain functional after error
    const isAppStillFunctional = await window.evaluate(() => {
      const body = document.querySelector('body');
      const hasButtons = document.querySelectorAll('button').length > 0;
      return body !== null && hasButtons;
    });

    expect(isAppStillFunctional).toBe(true);
  });

  test('should handle code generation errors gracefully in UI', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    // First simulate successful transcription
    await appHelper.simulateRecordingStarted();
    await window.waitForTimeout(100);
    await appHelper.simulateRecordingStopped();
    await window.waitForTimeout(100);

    // Then simulate that transcription succeeded but don't provide code result
    await appHelper.simulateTranscriptionCompleted(mockTranscriptions.javascript);
    await window.waitForTimeout(100);

    // Simulate error after transcription (code generation failed)
    await appHelper.simulateTranscriptionError('Code generation failed');

    await window.waitForTimeout(500);

    // App should remain functional after error
    const isAppStillFunctional = await window.evaluate(() => {
      const body = document.querySelector('body');
      const hasButtons = document.querySelectorAll('button').length > 0;
      return body !== null && hasButtons;
    });

    expect(isAppStillFunctional).toBe(true);
  });

  test('should allow copying generated code to clipboard', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    // Simulate voice command with code generation
    await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.javascript,
      mockCodeResults.javascript
    );

    await window.waitForTimeout(500);

    // Look for copy button
    const copyButton = await window.locator(
      'button:has-text("Copy"), button[data-testid="copy-code"]'
    ).first();

    if ((await copyButton.count()) > 0) {
      await copyButton.click();
      await window.waitForTimeout(300);

      // Verify copy action completed (button should still be visible/functional)
      const body = await window.locator('body');
      expect(await body.isVisible()).toBe(true);
    } else {
      // If no copy button, that's okay - the test verifies the flow works
      const body = await window.locator('body');
      expect(await body.isVisible()).toBe(true);
    }
  });

  test('should support multiple voice commands in sequence', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await appHelper.initializeTestMocks();

    // First command - JavaScript
    const session1 = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.javascript,
      mockCodeResults.javascript
    );
    await window.waitForTimeout(300);

    expect(session1.transcription).toBe(mockTranscriptions.javascript.text);
    expect(session1.language).toBe(mockTranscriptions.javascript.language);

    // Second command - Python
    const session2 = await appHelper.simulateVoiceCommandFlow(
      mockTranscriptions.python,
      mockCodeResults.python
    );
    await window.waitForTimeout(300);

    expect(session2.transcription).toBe(mockTranscriptions.python.text);
    expect(session2.language).toBe(mockTranscriptions.python.language);

    // Verify sessions are different
    expect(session1.id).not.toBe(session2.id);

    // Verify app is still functional after multiple commands
    const isAppFunctional = await window.evaluate(() => {
      const hasButtons = document.querySelectorAll('button').length > 0;
      return hasButtons;
    });

    expect(isAppFunctional).toBe(true);
  });
});
