import { test, expect } from '@playwright/test';

test.describe('Admin Panel Navigation', () => {
  const adminPages = [
    '/admin/overview',
    '/admin/products',
    '/admin/promotions/banners',
    '/admin/orders',
    '/admin/categories',
    '/admin/brands',
    '/admin/users',
  ];

  for (const pagePath of adminPages) {
    test(`can navigate to ${pagePath}`, async ({ page }) => {
      // Try to navigate to admin page
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' }).catch(() => {});

      const currentUrl = page.url();
      const isOnPage = currentUrl.includes(pagePath);
      const isSignIn = currentUrl.includes('/sign-in');
      const isUnauthorized = currentUrl.includes('/unauthorized');

      // Either on the page or redirected to sign-in/unauthorized (expected without auth)
      expect(isOnPage || isSignIn || isUnauthorized).toBeTruthy();
    });
  }

  test('admin pages exist and are routable', async ({ page }) => {
    // Try to access multiple admin pages
    for (const pagePath of adminPages.slice(0, 3)) {
      const response = await page.goto(pagePath, { waitUntil: 'domcontentloaded' }).catch(() => null);

      // Page should exist (not 404) - either loads or redirects
      const isOk = response?.status() === 200 || page.url().includes('/sign-in');

      expect(isOk).toBeTruthy();
    }
  });
});
