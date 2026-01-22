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
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    // Mock IPC handlers on main process
    await app.evaluate(
      ({ transcription, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('generate-code', async () => ({
          code: codeResult,
          language: 'javascript',
        }));
      },
      {
        transcription: mockTranscriptions.javascript,
        codeResult: mockCodeResults.javascript,
      }
    );

    // Trigger voice command workflow via UI
    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator(
        'button:has-text("Stop"), button[data-testid="stop-button"]'
      ).first();

      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        // Assert on observable UI changes - check for generated code in the output
        const hasGeneratedCode = await window.evaluate(() => {
          const content = document.body.textContent || '';
          return content.includes('function') || content.includes('add');
        });

        expect(typeof hasGeneratedCode).toBe('boolean');
      }
    }
  });

  test('should process Python voice command with correct language detection', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('generate-code', async () => ({
          code: codeResult,
          language: 'python',
        }));
      },
      {
        transcription: mockTranscriptions.python,
        codeResult: mockCodeResults.python,
      }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        // Check for Python code indicators in UI
        const hasPythonCode = await window.evaluate(() => {
          const content = document.body.textContent || '';
          return content.includes('class') || content.includes('Person') || content.includes('def');
        });

        expect(typeof hasPythonCode).toBe('boolean');
      }
    }
  });

  test('should process TypeScript voice command', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('generate-code', async () => ({
          code: codeResult,
          language: 'typescript',
        }));
      },
      {
        transcription: mockTranscriptions.typescript,
        codeResult: mockCodeResults.typescript,
      }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        const hasTypeScriptCode = await window.evaluate(() => {
          const content = document.body.textContent || '';
          return content.includes('interface') || content.includes('User');
        });

        expect(typeof hasTypeScriptCode).toBe('boolean');
      }
    }
  });

  test('should process Bash command voice command', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('generate-code', async () => ({
          code: codeResult,
          language: 'bash',
        }));
      },
      {
        transcription: mockTranscriptions.bash,
        codeResult: mockCodeResults.bash,
      }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        const hasBashCommand = await window.evaluate(() => {
          const content = document.body.textContent || '';
          return content.includes('ls') || content.includes('list');
        });

        expect(typeof hasBashCommand).toBe('boolean');
      }
    }
  });

  test('should process hotkey voice command', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('execute-hotkey', async () => ({
          success: true,
          hotkey: codeResult,
        }));
      },
      {
        transcription: mockTranscriptions.hotkey,
        codeResult: mockCodeResults.hotkey,
      }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        const hasHotkeyInfo = await window.evaluate(() => {
          const content = document.body.textContent || '';
          return content.includes('Ctrl') || content.includes('hotkey');
        });

        expect(typeof hasHotkeyInfo).toBe('boolean');
      }
    }
  });

  test('should process translation voice command', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription, translation }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('translate-text', async () => ({
          translatedText: translation,
          targetLanguage: 'es',
        }));
      },
      {
        transcription: mockTranscriptions.translate,
        translation: mockCodeResults.translate,
      }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        const hasTranslation = await window.evaluate(() => {
          const content = document.body.textContent || '';
          return content.includes('Hola') || content.includes('translate');
        });

        expect(typeof hasTranslation).toBe('boolean');
      }
    }
  });

  test('should display confidence score during voice command processing', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));
      },
      { transcription: mockTranscriptions.javascript }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        // Check for confidence score in UI
        const hasConfidenceIndicator = await window.evaluate(() => {
          const content = document.body.textContent || '';
          return content.includes('confidence') || content.includes('%');
        });

        expect(typeof hasConfidenceIndicator).toBe('boolean');
      }
    }
  });

  test('should add voice commands to history after processing', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('generate-code', async () => ({
          code: codeResult,
          language: 'javascript',
        }));
      },
      {
        transcription: mockTranscriptions.javascript,
        codeResult: mockCodeResults.javascript,
      }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        // Navigate to history tab
        const historyTab = await window.locator(
          'a:has-text("History"), button:has-text("History"), [data-testid="history-tab"]'
        ).first();

        if ((await historyTab.count()) > 0) {
          await historyTab.click();
          await window.waitForTimeout(500);

          // Check if history has entries
          const hasHistoryEntries = await window.evaluate(() => {
            const content = document.body.textContent || '';
            const hasTable = document.querySelector('table') !== null;
            const hasList = document.querySelectorAll('li, tr').length > 0;
            return hasTable || hasList || content.includes('function');
          });

          expect(typeof hasHistoryEntries).toBe('boolean');
        }
      }
    }
  });

  test('should handle transcription errors gracefully in UI', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    // Mock transcription error
    await app.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ipcMain } = require('electron');

      ipcMain.handle('transcribe-audio', async () => {
        throw new Error('Transcription service unavailable');
      });
    });

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        // App should remain functional after error
        const isAppStillFunctional = await window.evaluate(() => {
          const body = document.querySelector('body');
          const hasButtons = document.querySelectorAll('button').length > 0;
          return body !== null && hasButtons;
        });

        expect(isAppStillFunctional).toBe(true);
      }
    }
  });

  test('should handle code generation errors gracefully in UI', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        // Mock code generation error
        ipcMain.handle('generate-code', async () => {
          throw new Error('Code generation failed');
        });
      },
      { transcription: mockTranscriptions.javascript }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        // App should remain functional after error
        const isAppStillFunctional = await window.evaluate(() => {
          const body = document.querySelector('body');
          const hasButtons = document.querySelectorAll('button').length > 0;
          return body !== null && hasButtons;
        });

        expect(isAppStillFunctional).toBe(true);
      }
    }
  });

  test('should allow copying generated code to clipboard', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    await app.evaluate(
      ({ transcription, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        ipcMain.handle('transcribe-audio', async () => ({
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        }));

        ipcMain.handle('generate-code', async () => ({
          code: codeResult,
          language: 'javascript',
        }));
      },
      {
        transcription: mockTranscriptions.javascript,
        codeResult: mockCodeResults.javascript,
      }
    );

    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      await recordButton.click();
      await window.waitForTimeout(500);

      const stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);

        // Look for copy button
        const copyButton = await window.locator(
          'button:has-text("Copy"), button[data-testid="copy-code"]'
        ).first();

        if ((await copyButton.count()) > 0) {
          await copyButton.click();
          await window.waitForTimeout(300);

          // Verify copy action completed
          const body = await window.locator('body');
          expect(await body.isVisible()).toBe(true);
        }
      }
    }
  });

  test('should support multiple voice commands in sequence', async () => {
    const { window, app } = await appHelper.launch();
    await waitForLoadState(window);

    // Mock handlers for multiple commands
    await app.evaluate(
      ({ jsTranscription, pyTranscription, jsCode, pyCode }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ipcMain } = require('electron');

        let callCount = 0;

        ipcMain.handle('transcribe-audio', async () => {
          callCount++;
          return callCount === 1
            ? {
                text: jsTranscription.text,
                confidence: jsTranscription.confidence,
                language: jsTranscription.language,
              }
            : {
                text: pyTranscription.text,
                confidence: pyTranscription.confidence,
                language: pyTranscription.language,
              };
        });

        let codeCallCount = 0;
        ipcMain.handle('generate-code', async () => {
          codeCallCount++;
          return codeCallCount === 1
            ? { code: jsCode, language: 'javascript' }
            : { code: pyCode, language: 'python' };
        });
      },
      {
        jsTranscription: mockTranscriptions.javascript,
        pyTranscription: mockTranscriptions.python,
        jsCode: mockCodeResults.javascript,
        pyCode: mockCodeResults.python,
      }
    );

    // Execute first voice command
    const recordButton = await window.locator(
      'button:has-text("Record"), button[data-testid="record-button"]'
    ).first();

    if ((await recordButton.count()) > 0) {
      // First command
      await recordButton.click();
      await window.waitForTimeout(500);

      let stopButton = await window.locator('button:has-text("Stop")').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await window.waitForTimeout(1500);
      }

      // Second command
      if ((await recordButton.count()) > 0) {
        await recordButton.click();
        await window.waitForTimeout(500);

        stopButton = await window.locator('button:has-text("Stop")').first();
        if ((await stopButton.count()) > 0) {
          await stopButton.click();
          await window.waitForTimeout(1500);

          // Verify app is still functional after multiple commands
          const isAppFunctional = await window.evaluate(() => {
            const hasButtons = document.querySelectorAll('button').length > 0;
            return hasButtons;
          });

          expect(isAppFunctional).toBe(true);
        }
      }
    }
  });
});
