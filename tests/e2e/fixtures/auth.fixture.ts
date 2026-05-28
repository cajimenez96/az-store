import { test as base } from '@playwright/test';
import path from 'path';

type AuthFixtures = {
  authenticatedPage: void;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const authFile = path.resolve(__dirname, '../.auth/admin.json');
    await page.context().addInitScript(() => {
      // Ensure we start with a fresh page
    });

    // Load the saved session
    const context = page.context();
    await context.addCookies([]);

    // Note: storageState is loaded automatically via playwright.config.ts
    // for pages that specify use: { storageState: authFile }

    await use();
  },
});

export { expect } from '@playwright/test';
