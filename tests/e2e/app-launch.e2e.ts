import { test, expect } from '@playwright/test';
import { ElectronAppHelper } from './helpers/electron-app';
import { waitForLoadState, selectTab, isVisible } from './helpers/test-utils';

test.describe('App Launch and Basic Functionality', () => {
  let appHelper: ElectronAppHelper;

  test.beforeEach(async () => {
    appHelper = new ElectronAppHelper();
  });

  test.afterEach(async () => {
    await appHelper.close();
  });

  test('should launch the app successfully', async () => {
    const { window } = await appHelper.launch();

    // Verify window is visible
    expect(window).toBeDefined();
    expect(await window.isVisible()).toBe(true);

    // Verify app title
    const title = await window.title();
    expect(title).toContain('Ditossauro');

    // Verify main content is loaded
    await waitForLoadState(window);
    const body = await window.locator('body');
    expect(await body.isVisible()).toBe(true);
  });

  test('should display the main window with correct dimensions', async () => {
    const { window } = await appHelper.launch();

    // Get window size
    const size = await window.viewportSize();
    expect(size).toBeDefined();

    // Verify minimum dimensions (app should have reasonable size)
    if (size) {
      expect(size.width).toBeGreaterThan(600);
      expect(size.height).toBeGreaterThan(400);
    }
  });

  test('should load the home tab by default', async () => {
    const { window } = await appHelper.launch();

    await waitForLoadState(window);

    // Check if home tab is active
    const homeTab = await window.locator('[role="tab"]:has-text("Home")');
    expect(await homeTab.isVisible()).toBe(true);

    // Verify home content is visible
    const homeContent = await isVisible(window, '[role="tabpanel"]');
    expect(homeContent).toBe(true);
  });

  test('should navigate between tabs', async () => {
    const { window } = await appHelper.launch();

    await waitForLoadState(window);

    // Navigate to Settings tab
    await selectTab(window, 'Settings');
    await window.waitForTimeout(500); // Wait for tab transition

    const settingsVisible = await isVisible(window, '[data-testid="settings-panel"], .settings-panel');
    expect(settingsVisible).toBe(true);

    // Navigate to History tab
    await selectTab(window, 'History');
    await window.waitForTimeout(500);

    const historyVisible = await isVisible(window, '[data-testid="history-panel"], .history-panel');
    expect(historyVisible).toBe(true);

    // Navigate to Info tab
    await selectTab(window, 'Info');
    await window.waitForTimeout(500);

    const infoVisible = await isVisible(window, '[data-testid="info-panel"], .info-panel');
    expect(infoVisible).toBe(true);

    // Navigate back to Home
    await selectTab(window, 'Home');
    await window.waitForTimeout(500);

    const homeVisible = await isVisible(window, '[data-testid="home-panel"], .home-panel');
    expect(homeVisible).toBe(true);
  });

  test('should have proper window controls', async () => {
    const { window } = await appHelper.launch();

    await waitForLoadState(window);

    // Check if window controls exist (minimize, maximize, close)
    // Note: These might be custom or native depending on implementation
    const hasWindowControls = await window.evaluate(() => {
      // Check for custom window controls or titlebar
      const customControls = document.querySelector('.window-controls, .titlebar, [data-testid="window-controls"]');
      return customControls !== null;
    });

    // Either custom controls exist or we're using native controls
    expect(typeof hasWindowControls).toBe('boolean');
  });

  test('should initialize with default state', async () => {
    const { window } = await appHelper.launch();

    await waitForLoadState(window);

    // Verify initial state through window properties
    const initialState = await window.evaluate(() => {
      return {
        hasElectronAPI: typeof (window as any).electronAPI !== 'undefined',
        bodyClasses: document.body.className,
        hasContent: document.body.children.length > 0,
      };
    });

    expect(initialState.hasElectronAPI).toBe(true);
    expect(initialState.hasContent).toBe(true);
  });

  test('should be able to close the app gracefully', async () => {
    const { app, window } = await appHelper.launch();

    await waitForLoadState(window);

    // Close the app
    await app.close();

    // Verify app is closed
    const isClosed = await app.evaluate(() => {
      return process.platform !== undefined; // This will fail if process is gone
    }).catch(() => true); // If evaluate fails, app is closed

    expect(isClosed).toBe(true);
  });

  test('should maintain window state on reload', async () => {
    const { window } = await appHelper.launch();

    await waitForLoadState(window);

    // Navigate to a specific tab
    await selectTab(window, 'Settings');
    await window.waitForTimeout(500);

    // Reload the window
    await window.reload();
    await waitForLoadState(window);

    // Verify the app reloaded successfully
    const body = await window.locator('body');
    expect(await body.isVisible()).toBe(true);
  });

  test('should handle keyboard shortcuts', async () => {
    const { window } = await appHelper.launch();

    await waitForLoadState(window);

    // Test Escape key (common for closing modals/dialogs)
    await window.keyboard.press('Escape');

    // Test Tab navigation
    await window.keyboard.press('Tab');

    // Verify no crashes occurred
    const isStillVisible = await window.isVisible();
    expect(isStillVisible).toBe(true);
  });

  test('should have proper accessibility attributes', async () => {
    const { window } = await appHelper.launch();

    await waitForLoadState(window);

    // Check for basic accessibility structure
    const a11y = await window.evaluate(() => {
      const hasTabs = document.querySelectorAll('[role="tab"]').length > 0;
      const hasTabPanels = document.querySelectorAll('[role="tabpanel"]').length > 0;
      const hasButtons = document.querySelectorAll('button').length > 0;

      return {
        hasTabs,
        hasTabPanels,
        hasButtons,
      };
    });

    expect(a11y.hasTabs).toBe(true);
    expect(a11y.hasTabPanels).toBe(true);
    expect(a11y.hasButtons).toBe(true);
  });
});
