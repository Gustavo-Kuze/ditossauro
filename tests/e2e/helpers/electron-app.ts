import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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

    // Wait for the main window
    this.mainWindow = await this.app.firstWindow();

    // Wait for the app to be ready
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
      await this.app.close();
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
}
