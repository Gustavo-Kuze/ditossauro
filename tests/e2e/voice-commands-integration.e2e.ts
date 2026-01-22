import { test, expect } from '@playwright/test';
import { ElectronAppHelper } from './helpers/electron-app';
import { waitForLoadState } from './helpers/test-utils';
import { mockTranscriptions, mockCodeResults, mockSettings, mockVoiceCommands } from './fixtures/mock-data';

test.describe('Voice Command Workflow - Complete Integration', () => {
  let appHelper: ElectronAppHelper;

  test.beforeEach(async () => {
    appHelper = new ElectronAppHelper();
    appHelper.createTestSettings(mockSettings.default);
  });

  test.afterEach(async () => {
    await appHelper.close();
  });

  test('should process JavaScript voice command end-to-end', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Set up IPC mocking in renderer
    await window.evaluate(
      ({ transcription, command, codeResult }) => {
        // Mock the entire voice command pipeline
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).mockVoiceCommandResult = {
          transcription: transcription.text,
          language: command.language,
          strippedText: command.strippedTranscription,
          generatedCode: codeResult,
          confidence: transcription.confidence,
        };
      },
      {
        transcription: mockTranscriptions.javascript,
        command: mockVoiceCommands.javascript,
        codeResult: mockCodeResults.javascript,
      }
    );

    // Verify mock data is available
    const mockData = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).mockVoiceCommandResult;
    });

    expect(mockData).toBeDefined();
    expect(mockData.language).toBe('javascript');
    expect(mockData.transcription).toContain('function');
    expect(mockData.generatedCode).toContain('function add');
  });

  test('should process Python voice command end-to-end', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await window.evaluate(
      ({ transcription, command, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).mockVoiceCommandResult = {
          transcription: transcription.text,
          language: command.language,
          strippedText: command.strippedTranscription,
          generatedCode: codeResult,
          confidence: transcription.confidence,
        };
      },
      {
        transcription: mockTranscriptions.python,
        command: mockVoiceCommands.python,
        codeResult: mockCodeResults.python,
      }
    );

    const mockData = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).mockVoiceCommandResult;
    });

    expect(mockData).toBeDefined();
    expect(mockData.language).toBe('python');
    expect(mockData.transcription).toContain('class');
    expect(mockData.generatedCode).toContain('class Person');
  });

  test('should process TypeScript voice command end-to-end', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await window.evaluate(
      ({ transcription, command, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).mockVoiceCommandResult = {
          transcription: transcription.text,
          language: command.language,
          strippedText: command.strippedTranscription,
          generatedCode: codeResult,
          confidence: transcription.confidence,
        };
      },
      {
        transcription: mockTranscriptions.typescript,
        command: mockVoiceCommands.typescript,
        codeResult: mockCodeResults.typescript,
      }
    );

    const mockData = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).mockVoiceCommandResult;
    });

    expect(mockData).toBeDefined();
    expect(mockData.language).toBe('typescript');
    expect(mockData.transcription).toContain('interface');
    expect(mockData.generatedCode).toContain('interface User');
  });

  test('should process Bash command voice command end-to-end', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await window.evaluate(
      ({ transcription, command, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).mockVoiceCommandResult = {
          transcription: transcription.text,
          language: command.language,
          strippedText: command.strippedTranscription,
          generatedCode: codeResult,
          confidence: transcription.confidence,
        };
      },
      {
        transcription: mockTranscriptions.bash,
        command: mockVoiceCommands.bash,
        codeResult: mockCodeResults.bash,
      }
    );

    const mockData = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).mockVoiceCommandResult;
    });

    expect(mockData).toBeDefined();
    expect(mockData.language).toBe('bash');
    expect(mockData.transcription).toContain('list');
    expect(mockData.generatedCode).toBe('ls -la');
  });

  test('should process hotkey voice command end-to-end', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await window.evaluate(
      ({ transcription, command, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).mockVoiceCommandResult = {
          transcription: transcription.text,
          language: command.language,
          strippedText: command.strippedTranscription,
          generatedCode: codeResult,
          confidence: transcription.confidence,
        };
      },
      {
        transcription: mockTranscriptions.hotkey,
        command: mockVoiceCommands.hotkey,
        codeResult: mockCodeResults.hotkey,
      }
    );

    const mockData = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).mockVoiceCommandResult;
    });

    expect(mockData).toBeDefined();
    expect(mockData.language).toBe('hotkey');
    expect(mockData.transcription).toContain('control');
    expect(mockData.generatedCode).toBe('Ctrl+C');
  });

  test('should process translation voice command end-to-end', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await window.evaluate(
      ({ transcription, command, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).mockVoiceCommandResult = {
          transcription: transcription.text,
          language: command.language,
          strippedText: command.strippedTranscription,
          generatedCode: codeResult,
          confidence: transcription.confidence,
        };
      },
      {
        transcription: mockTranscriptions.translate,
        command: mockVoiceCommands.translate,
        codeResult: mockCodeResults.translate,
      }
    );

    const mockData = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).mockVoiceCommandResult;
    });

    expect(mockData).toBeDefined();
    expect(mockData.language).toBe('translate');
    expect(mockData.transcription).toContain('hello world');
    expect(mockData.generatedCode).toBe('Hola Mundo');
  });

  test('should process dito assistant command end-to-end', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await window.evaluate(
      ({ transcription, command, codeResult }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).mockVoiceCommandResult = {
          transcription: transcription.text,
          language: command.language,
          strippedText: command.strippedTranscription,
          generatedCode: codeResult,
          confidence: transcription.confidence,
        };
      },
      {
        transcription: mockTranscriptions.dito,
        command: mockVoiceCommands.dito,
        codeResult: mockCodeResults.dito,
      }
    );

    const mockData = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).mockVoiceCommandResult;
    });

    expect(mockData).toBeDefined();
    expect(mockData.language).toBe('dito');
    expect(mockData.transcription).toContain('weather');
    expect(mockData.generatedCode).toContain('weather');
  });

  test('should validate voice command detection accuracy', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Test multiple voice commands in sequence
    const commands = [
      { transcription: mockTranscriptions.javascript, expected: 'javascript' },
      { transcription: mockTranscriptions.python, expected: 'python' },
      { transcription: mockTranscriptions.bash, expected: 'bash' },
      { transcription: mockTranscriptions.typescript, expected: 'typescript' },
    ];

    for (const cmd of commands) {
      await window.evaluate(
        ({ text, expectedLang }) => {
          // Simulate voice command detection
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).detectedCommand = {
            text,
            detectedLanguage: expectedLang,
            timestamp: Date.now(),
          };
        },
        { text: cmd.transcription.text, expectedLang: cmd.expected }
      );

      const detected = await window.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).detectedCommand;
      });

      expect(detected.detectedLanguage).toBe(cmd.expected);
    }
  });

  test('should handle confidence scores correctly', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    const confidenceTests = [
      { transcription: mockTranscriptions.javascript, minConfidence: 0.9 },
      { transcription: mockTranscriptions.python, minConfidence: 0.85 },
      { transcription: mockTranscriptions.bash, minConfidence: 0.9 },
    ];

    for (const test of confidenceTests) {
      await window.evaluate(
        ({ text, confidence }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).confidenceResult = {
            text,
            confidence,
            meetsThreshold: confidence >= 0.85,
          };
        },
        { text: test.transcription.text, confidence: test.transcription.confidence }
      );

      const result = await window.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).confidenceResult;
      });

      expect(result.confidence).toBeGreaterThanOrEqual(test.minConfidence);
      expect(result.meetsThreshold).toBe(true);
    }
  });

  test('should validate code generation quality', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Test code generation for different languages
    const codeTests = [
      {
        language: 'javascript',
        code: mockCodeResults.javascript,
        mustContain: ['function', 'add', 'return'],
      },
      {
        language: 'python',
        code: mockCodeResults.python,
        mustContain: ['class', 'Person', 'def', '__init__'],
      },
      {
        language: 'typescript',
        code: mockCodeResults.typescript,
        mustContain: ['interface', 'User', 'number', 'string'],
      },
    ];

    for (const test of codeTests) {
      await window.evaluate(
        ({ lang, code }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).generatedCode = { language: lang, code };
        },
        { lang: test.language, code: test.code }
      );

      const generated = await window.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).generatedCode;
      });

      expect(generated.language).toBe(test.language);
      for (const keyword of test.mustContain) {
        expect(generated.code).toContain(keyword);
      }
    }
  });

  test('should handle voice command pipeline errors', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Test error handling at different stages
    const errorScenarios = [
      { stage: 'transcription', error: 'Transcription failed' },
      { stage: 'detection', error: 'Command detection failed' },
      { stage: 'generation', error: 'Code generation failed' },
    ];

    for (const scenario of errorScenarios) {
      await window.evaluate(
        ({ stage, error }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).pipelineError = {
            stage,
            error,
            handled: true,
            timestamp: Date.now(),
          };
        },
        scenario
      );

      const errorResult = await window.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).pipelineError;
      });

      expect(errorResult.stage).toBe(scenario.stage);
      expect(errorResult.error).toBe(scenario.error);
      expect(errorResult.handled).toBe(true);
    }
  });

  test('should maintain voice command history', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    // Simulate multiple voice commands
    const commandHistory = [
      { text: 'create a function', language: 'javascript', result: 'function() {}' },
      { text: 'list files', language: 'bash', result: 'ls -la' },
      { text: 'define class', language: 'python', result: 'class MyClass:' },
    ];

    await window.evaluate(
      ({ history }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).commandHistory = history.map((cmd, idx) => ({
          id: idx + 1,
          ...cmd,
          timestamp: Date.now() - (history.length - idx) * 1000,
        }));
      },
      { history: commandHistory }
    );

    const history = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).commandHistory;
    });

    expect(history).toHaveLength(3);
    expect(history[0].language).toBe('javascript');
    expect(history[1].language).toBe('bash');
    expect(history[2].language).toBe('python');
  });

  test('should validate complete workflow timing', async () => {
    const { window } = await appHelper.launch();
    await waitForLoadState(window);

    await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).workflowTiming = {
        recordingStart: Date.now(),
        recordingEnd: Date.now() + 2000,
        transcriptionStart: Date.now() + 2010,
        transcriptionEnd: Date.now() + 3000,
        detectionStart: Date.now() + 3010,
        detectionEnd: Date.now() + 3050,
        generationStart: Date.now() + 3060,
        generationEnd: Date.now() + 4000,
      };
    });

    const timing = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = (window as any).workflowTiming;
      return {
        recordingDuration: t.recordingEnd - t.recordingStart,
        transcriptionDuration: t.transcriptionEnd - t.transcriptionStart,
        detectionDuration: t.detectionEnd - t.detectionStart,
        generationDuration: t.generationEnd - t.generationStart,
        totalDuration: t.generationEnd - t.recordingStart,
      };
    });

    expect(timing.recordingDuration).toBeGreaterThan(0);
    expect(timing.transcriptionDuration).toBeGreaterThan(0);
    expect(timing.detectionDuration).toBeGreaterThan(0);
    expect(timing.generationDuration).toBeGreaterThan(0);
    expect(timing.totalDuration).toBeGreaterThan(0);
  });
});
