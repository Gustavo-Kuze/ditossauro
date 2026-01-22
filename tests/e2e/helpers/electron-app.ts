import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

/**
 * Interface for mock transcription data
 */
export interface MockTranscription {
  text: string;
  confidence: number;
  language: string;
  duration?: number;
}

/**
 * Interface for mock code generation result
 */
export interface MockCodeResult {
  code: string;
  language: string;
}

/**
 * Interface for a transcription session
 */
export interface TranscriptionSession {
  id: string;
  timestamp: Date;
  transcription: string;
  duration: number;
  language: string;
  confidence: number;
}

/**
 * Helper class for managing Electron app lifecycle during e2e tests
 */
export class ElectronAppHelper {
  private app: ElectronApplication | null = null;
  private mainWindow: Page | null = null;
  private testDataDir: string;

  constructor() {
    // Create a unique test data directory for each test session
    this.testDataDir = path.join(os.tmpdir(), `ditossauro-test-${Date.now()}`);
  }

  /**
   * Launch the Electron app for testing
   */
  async launch(): Promise<{ app: ElectronApplication; window: Page }> {
    // Ensure test data directory exists
    if (!fs.existsSync(this.testDataDir)) {
      fs.mkdirSync(this.testDataDir, { recursive: true });
    }

    // Find the main entry point
    const mainPath = path.join(__dirname, '../../../.vite/build/main.js');

    // Launch Electron app
    this.app = await electron.launch({
      args: [mainPath],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DITOSSAURO_TEST_DATA_DIR: this.testDataDir,
      },
    });

    // Wait for the main window (not the floating window)
    // The main window has the title "Ditossauro" and contains the nav-tabs

    // Find the main window by checking for nav-tabs content
    let mainWindow: Page | null = null;
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const allWindows = await this.app.windows();

      for (const win of allWindows) {
        try {
          await win.waitForLoadState('domcontentloaded', { timeout: 2000 });
          // Check if this window has the nav-tabs (main window indicator)
          const hasNavTabs = await win.locator('.nav-tabs').count() > 0;
          if (hasNavTabs) {
            mainWindow = win;
            break;
          }
        } catch {
          // Window not ready yet, continue
        }
      }

      if (mainWindow) break;

      // Wait a bit before next attempt
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!mainWindow) {
      // Fallback to first window if main window detection fails
      mainWindow = await this.app.firstWindow();
    }

    this.mainWindow = mainWindow;

    // Wait for the app to be fully ready
    await this.mainWindow.waitForLoadState('domcontentloaded');

    return {
      app: this.app,
      window: this.mainWindow,
    };
  }

  /**
   * Get the main window
   */
  getWindow(): Page | null {
    return this.mainWindow;
  }

  /**
   * Get the Electron app instance
   */
  getApp(): ElectronApplication | null {
    return this.app;
  }

  /**
   * Clean up test data directory
   */
  cleanupTestData(): void {
    if (fs.existsSync(this.testDataDir)) {
      fs.rmSync(this.testDataDir, { recursive: true, force: true });
    }
  }

  /**
   * Get the test data directory path
   */
  getTestDataDir(): string {
    return this.testDataDir;
  }

  /**
   * Create test settings file
   */
  createTestSettings(settings: Record<string, unknown>): void {
    if (!fs.existsSync(this.testDataDir)) {
      fs.mkdirSync(this.testDataDir, { recursive: true });
    }
    const settingsPath = path.join(this.testDataDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }

  /**
   * Read settings file
   */
  readTestSettings(): Record<string, unknown> | null {
    const settingsPath = path.join(this.testDataDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  }

  /**
   * Create test history file
   */
  createTestHistory(history: unknown[]): void {
    if (!fs.existsSync(this.testDataDir)) {
      fs.mkdirSync(this.testDataDir, { recursive: true });
    }
    const historyPath = path.join(this.testDataDir, 'history.json');
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  /**
   * Read history file
   */
  readTestHistory(): unknown[] | null {
    const historyPath = path.join(this.testDataDir, 'history.json');
    if (fs.existsSync(historyPath)) {
      const content = fs.readFileSync(historyPath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  }

  /**
   * Close the Electron app and cleanup
   */
  async close(): Promise<void> {
    if (this.app) {
      let processId: number | null = null;

      try {
        // Get the process ID before closing
        processId = await this.app.evaluate(() => process.pid).catch(() => null);
      } catch {
        // Ignore - app may already be closed
      }

      // Force kill immediately - don't wait for graceful close
      // The uiohook module prevents graceful shutdown
      if (processId && process.platform === 'win32') {
        try {
          execSync(`taskkill /F /PID ${processId} /T 2>nul`, { stdio: 'ignore' });
        } catch {
          // Process may already be killed, ignore
        }
      } else if (processId) {
        try {
          execSync(`kill -9 -${processId} 2>/dev/null || kill -9 ${processId} 2>/dev/null`, { stdio: 'ignore' });
        } catch {
          // Process may already be killed, ignore
        }
      }

      // Small delay to allow OS to clean up process resources
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Now try to close the Playwright connection
      try {
        await this.app.close().catch(() => {
          // Ignore error - process was already killed
        });
      } catch {
        // Ignore - connection may already be closed
      }

      this.app = null;
      this.mainWindow = null;
    }
    this.cleanupTestData();
  }

  /**
   * Evaluate code in the main process
   */
  async evaluateInMain<T>(fn: () => T): Promise<T> {
    if (!this.app) {
      throw new Error('App not launched');
    }
    return this.app.evaluate(fn);
  }

  /**
   * Evaluate code in the renderer process
   */
  async evaluateInRenderer<T>(fn: () => T): Promise<T> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }
    return this.mainWindow.evaluate(fn);
  }

  /**
   * Wait for a specific event from the main process
   */
  async waitForMainEvent(eventName: string, timeout = 5000): Promise<unknown> {
    if (!this.app) {
      throw new Error('App not launched');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      this.app?.evaluate(
        ({ eventName }) => {
          return new Promise((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { ipcMain } = require('electron');
            ipcMain.once(eventName, (_event, data) => {
              resolve(data);
            });
          });
        },
        { eventName }
      ).then((data) => {
        clearTimeout(timer);
        resolve(data);
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Take a screenshot of the current window
   */
  async screenshot(path: string): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }
    await this.mainWindow.screenshot({ path });
  }

  /**
   * Initialize test mocking system in the renderer.
   * This sets up the infrastructure for simulating voice command flows.
   */
  async initializeTestMocks(): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }

    await this.mainWindow.evaluate(() => {
      // Store for registered callbacks
      interface TestMockStore {
        transcriptionCallbacks: ((session: unknown) => void)[];
        recordingStartedCallbacks: (() => void)[];
        recordingStoppedCallbacks: (() => void)[];
        processingStartedCallbacks: (() => void)[];
        textInsertedCallbacks: ((text: string) => void)[];
        errorCallbacks: ((error: string) => void)[];
      }

      const mockStore: TestMockStore = {
        transcriptionCallbacks: [],
        recordingStartedCallbacks: [],
        recordingStoppedCallbacks: [],
        processingStartedCallbacks: [],
        textInsertedCallbacks: [],
        errorCallbacks: [],
      };

      // Store the mock system on window
      (window as unknown as { __testMocks__: TestMockStore }).__testMocks__ = mockStore;

      // Get original electronAPI
      const originalAPI = (window as unknown as { electronAPI: Record<string, unknown> }).electronAPI;

      if (originalAPI) {
        // Wrap onTranscriptionCompleted to capture callbacks
        const originalOnTranscriptionCompleted = originalAPI.onTranscriptionCompleted as (
          cb: (session: unknown) => void
        ) => () => void;
        originalAPI.onTranscriptionCompleted = (callback: (session: unknown) => void) => {
          mockStore.transcriptionCallbacks.push(callback);
          const unsubscribe = originalOnTranscriptionCompleted(callback);
          return () => {
            const idx = mockStore.transcriptionCallbacks.indexOf(callback);
            if (idx > -1) mockStore.transcriptionCallbacks.splice(idx, 1);
            unsubscribe();
          };
        };

        // Wrap onRecordingStarted
        const originalOnRecordingStarted = originalAPI.onRecordingStarted as (cb: () => void) => () => void;
        originalAPI.onRecordingStarted = (callback: () => void) => {
          mockStore.recordingStartedCallbacks.push(callback);
          const unsubscribe = originalOnRecordingStarted(callback);
          return () => {
            const idx = mockStore.recordingStartedCallbacks.indexOf(callback);
            if (idx > -1) mockStore.recordingStartedCallbacks.splice(idx, 1);
            unsubscribe();
          };
        };

        // Wrap onRecordingStopped
        const originalOnRecordingStopped = originalAPI.onRecordingStopped as (cb: () => void) => () => void;
        originalAPI.onRecordingStopped = (callback: () => void) => {
          mockStore.recordingStoppedCallbacks.push(callback);
          const unsubscribe = originalOnRecordingStopped(callback);
          return () => {
            const idx = mockStore.recordingStoppedCallbacks.indexOf(callback);
            if (idx > -1) mockStore.recordingStoppedCallbacks.splice(idx, 1);
            unsubscribe();
          };
        };

        // Wrap onProcessingStarted
        const originalOnProcessingStarted = originalAPI.onProcessingStarted as (cb: () => void) => () => void;
        originalAPI.onProcessingStarted = (callback: () => void) => {
          mockStore.processingStartedCallbacks.push(callback);
          const unsubscribe = originalOnProcessingStarted(callback);
          return () => {
            const idx = mockStore.processingStartedCallbacks.indexOf(callback);
            if (idx > -1) mockStore.processingStartedCallbacks.splice(idx, 1);
            unsubscribe();
          };
        };

        // Wrap onTextInserted
        const originalOnTextInserted = originalAPI.onTextInserted as (cb: (text: string) => void) => () => void;
        originalAPI.onTextInserted = (callback: (text: string) => void) => {
          mockStore.textInsertedCallbacks.push(callback);
          const unsubscribe = originalOnTextInserted(callback);
          return () => {
            const idx = mockStore.textInsertedCallbacks.indexOf(callback);
            if (idx > -1) mockStore.textInsertedCallbacks.splice(idx, 1);
            unsubscribe();
          };
        };

        // Wrap onError
        const originalOnError = originalAPI.onError as (cb: (error: string) => void) => () => void;
        originalAPI.onError = (callback: (error: string) => void) => {
          mockStore.errorCallbacks.push(callback);
          const unsubscribe = originalOnError(callback);
          return () => {
            const idx = mockStore.errorCallbacks.indexOf(callback);
            if (idx > -1) mockStore.errorCallbacks.splice(idx, 1);
            unsubscribe();
          };
        };
      }
    });
  }

  /**
   * Simulate a complete voice command flow in the renderer.
   * This triggers the appropriate events that the UI responds to.
   */
  async simulateVoiceCommandFlow(
    transcription: MockTranscription,
    generatedCode?: MockCodeResult
  ): Promise<TranscriptionSession> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }

    const session = await this.mainWindow.evaluate(
      ({ transcription, generatedCode }) => {
        interface TestMockStore {
          transcriptionCallbacks: ((session: unknown) => void)[];
          recordingStartedCallbacks: (() => void)[];
          recordingStoppedCallbacks: (() => void)[];
          processingStartedCallbacks: (() => void)[];
          textInsertedCallbacks: ((text: string) => void)[];
          errorCallbacks: ((error: string) => void)[];
        }

        const mockStore = (window as unknown as { __testMocks__?: TestMockStore }).__testMocks__;

        // Create session object
        const session = {
          id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          transcription: transcription.text,
          duration: transcription.duration || 2.5,
          language: transcription.language,
          confidence: transcription.confidence,
        };

        // Trigger recording started callbacks
        if (mockStore) {
          mockStore.recordingStartedCallbacks.forEach(cb => cb());
        }

        // Small delay simulation (we'll do actual delays in the test)
        // Trigger recording stopped callbacks
        if (mockStore) {
          mockStore.recordingStoppedCallbacks.forEach(cb => cb());
        }

        // Trigger processing started callbacks
        if (mockStore) {
          mockStore.processingStartedCallbacks.forEach(cb => cb());
        }

        // Trigger transcription completed callbacks
        if (mockStore) {
          mockStore.transcriptionCallbacks.forEach(cb => cb(session));
        }

        // If code was generated, trigger text inserted
        if (generatedCode && mockStore) {
          mockStore.textInsertedCallbacks.forEach(cb => cb(generatedCode.code));
        }

        return session;
      },
      { transcription, generatedCode }
    );

    return session as TranscriptionSession;
  }

  /**
   * Simulate a transcription error in the renderer.
   */
  async simulateTranscriptionError(errorMessage: string): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }

    await this.mainWindow.evaluate((error) => {
      interface TestMockStore {
        errorCallbacks: ((error: string) => void)[];
        recordingStartedCallbacks: (() => void)[];
        recordingStoppedCallbacks: (() => void)[];
        processingStartedCallbacks: (() => void)[];
      }

      const mockStore = (window as unknown as { __testMocks__?: TestMockStore }).__testMocks__;

      if (mockStore) {
        // Trigger the flow up to the error
        mockStore.recordingStartedCallbacks.forEach(cb => cb());
        mockStore.recordingStoppedCallbacks.forEach(cb => cb());
        mockStore.processingStartedCallbacks.forEach(cb => cb());
        // Then trigger error
        mockStore.errorCallbacks.forEach(cb => cb(error));
      }
    }, errorMessage);
  }

  /**
   * Simulate recording started event only
   */
  async simulateRecordingStarted(): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }

    await this.mainWindow.evaluate(() => {
      interface TestMockStore {
        recordingStartedCallbacks: (() => void)[];
      }
      const mockStore = (window as unknown as { __testMocks__?: TestMockStore }).__testMocks__;
      if (mockStore) {
        mockStore.recordingStartedCallbacks.forEach(cb => cb());
      }
    });
  }

  /**
   * Simulate recording stopped event only
   */
  async simulateRecordingStopped(): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }

    await this.mainWindow.evaluate(() => {
      interface TestMockStore {
        recordingStoppedCallbacks: (() => void)[];
      }
      const mockStore = (window as unknown as { __testMocks__?: TestMockStore }).__testMocks__;
      if (mockStore) {
        mockStore.recordingStoppedCallbacks.forEach(cb => cb());
      }
    });
  }

  /**
   * Simulate transcription completed event
   */
  async simulateTranscriptionCompleted(transcription: MockTranscription): Promise<TranscriptionSession> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }

    return await this.mainWindow.evaluate((transcription) => {
      interface TestMockStore {
        transcriptionCallbacks: ((session: unknown) => void)[];
      }

      const mockStore = (window as unknown as { __testMocks__?: TestMockStore }).__testMocks__;

      const session = {
        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        transcription: transcription.text,
        duration: transcription.duration || 2.5,
        language: transcription.language,
        confidence: transcription.confidence,
      };

      if (mockStore) {
        mockStore.transcriptionCallbacks.forEach(cb => cb(session));
      }

      return session;
    }, transcription) as TranscriptionSession;
  }

  /**
   * Simulate text inserted event (e.g., after code generation)
   */
  async simulateTextInserted(text: string): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Window not available');
    }

    await this.mainWindow.evaluate((text) => {
      interface TestMockStore {
        textInsertedCallbacks: ((text: string) => void)[];
      }
      const mockStore = (window as unknown as { __testMocks__?: TestMockStore }).__testMocks__;
      if (mockStore) {
        mockStore.textInsertedCallbacks.forEach(cb => cb(text));
      }
    }, text);
  }
}
