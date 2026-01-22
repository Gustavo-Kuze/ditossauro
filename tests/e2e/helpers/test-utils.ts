import { Page } from '@playwright/test';

/**
 * Common test utilities for e2e tests
 */

/**
 * Wait for a specific selector with custom timeout
 */
export async function waitForSelector(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Click a button by text content
 */
export async function clickButtonByText(page: Page, text: string): Promise<void> {
  await page.click(`button:has-text("${text}")`);
}

/**
 * Fill an input field by label
 */
export async function fillInputByLabel(
  page: Page,
  label: string,
  value: string
): Promise<void> {
  const input = await page.locator(`label:has-text("${label}") + input`);
  await input.fill(value);
}

/**
 * Fill an input field by placeholder
 */
export async function fillInputByPlaceholder(
  page: Page,
  placeholder: string,
  value: string
): Promise<void> {
  await page.fill(`input[placeholder="${placeholder}"]`, value);
}

/**
 * Select a tab by name
 */
export async function selectTab(page: Page, tabName: string): Promise<void> {
  // Map display names to data-tab values (supports English and Portuguese)
  const tabMapping: Record<string, string> = {
    // English
    'Home': 'home',
    'Settings': 'settings',
    'History': 'history',
    'Info': 'about',
    'About': 'about',
    // Portuguese
    'Início': 'home',
    'Configurações': 'settings',
    'Histórico': 'history',
    'Sobre': 'about',
  };
  const tabValue = tabMapping[tabName] || tabName.toLowerCase();
  await page.click(`.nav-tab[data-tab="${tabValue}"]`);
}

/**
 * Check if an element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * Wait for a toast notification to appear
 */
export async function waitForToast(
  page: Page,
  expectedText?: string,
  timeout = 5000
): Promise<void> {
  if (expectedText) {
    await page.waitForSelector(`.toast:has-text("${expectedText}")`, { timeout });
  } else {
    await page.waitForSelector('.toast', { timeout });
  }
}

/**
 * Get text content of an element
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await page.locator(selector);
  return (await element.textContent()) || '';
}

/**
 * Check if a checkbox is checked
 */
export async function isChecked(page: Page, selector: string): Promise<boolean> {
  const element = await page.locator(selector);
  return await element.isChecked();
}

/**
 * Toggle a checkbox
 */
export async function toggleCheckbox(page: Page, selector: string): Promise<void> {
  await page.click(selector);
}

/**
 * Select an option from a dropdown
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.selectOption(selector, value);
}

/**
 * Wait for the page to be in a specific state
 */
export async function waitForLoadState(
  page: Page,
  state: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded'
): Promise<void> {
  await page.waitForLoadState(state);
}

/**
 * Simulate keyboard shortcut
 */
export async function pressShortcut(page: Page, shortcut: string): Promise<void> {
  await page.keyboard.press(shortcut);
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get all table rows data
 */
export async function getTableData(page: Page, tableSelector: string): Promise<string[][]> {
  const rows = await page.locator(`${tableSelector} tbody tr`).all();
  const data: string[][] = [];

  for (const row of rows) {
    const cells = await row.locator('td').all();
    const rowData: string[] = [];
    for (const cell of cells) {
      rowData.push((await cell.textContent()) || '');
    }
    data.push(rowData);
  }

  return data;
}

/**
 * Mock IPC communication
 */
export async function mockIPC(
  page: Page,
  channel: string,
  response: unknown
): Promise<void> {
  await page.evaluate(
    ({ channel, response }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).electronAPI = (window as any).electronAPI || {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).electronAPI[channel] = () => Promise.resolve(response);
    },
    { channel, response }
  );
}

/**
 * Wait for IPC call
 */
export async function waitForIPCCall(
  page: Page,
  channel: string,
  timeout = 5000
): Promise<unknown> {
  return page.evaluate(
    ({ channel, timeout }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout waiting for IPC call: ${channel}`));
        }, timeout);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const original = (window as any).electronAPI?.[channel];
        if (!original) {
          reject(new Error(`IPC channel not found: ${channel}`));
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electronAPI[channel] = (...args: unknown[]) => {
          clearTimeout(timer);
          resolve(args);
          return original(...args);
        };
      });
    },
    { channel, timeout }
  );
}
