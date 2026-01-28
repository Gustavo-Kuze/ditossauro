import { test as base } from '@playwright/test';
import { ElectronAppHelper } from '../helpers/electron-app';

/**
 * Custom test fixture that provides automatic Electron app lifecycle management
 */
export const test = base.extend<{ appHelper: ElectronAppHelper }>({
  appHelper: async (_context, use) => {
    const helper = new ElectronAppHelper();
    await use(helper);
    // Cleanup is handled in the helper's close method
    await helper.close();
  },
});

export { expect } from '@playwright/test';
