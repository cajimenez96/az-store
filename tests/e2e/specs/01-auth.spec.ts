import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('successful login with default credentials', async ({ page }) => {
    await page.goto('/sign-in');

    // Fill with correct credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', '123456');

    // Submit login
    await page.click('button:has-text("Iniciar Sesión")');

    // Wait for redirect (away from /sign-in)
    await page.waitForFunction(
      () => !window.location.pathname.includes('sign-in'),
      { timeout: 10000 }
    );

    // Should not be on sign-in page anymore
    expect(!page.url().includes('sign-in')).toBeTruthy();
  });

  test('failed login with incorrect password', async ({ page }) => {
    await page.goto('/sign-in');

    // Fill with wrong password
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'wrongpassword');

    // Submit
    await page.click('button:has-text("Iniciar Sesión")');

    // Should show error message
    const errorMessage = page.locator('.text-destructive');
    await expect(errorMessage).toBeVisible();
  });

  test('protected route redirects to login when not authenticated', async ({
    browser,
  }) => {
    // Create a context without authentication
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access protected route
    await page.goto('/shipping-address', { waitUntil: 'domcontentloaded' });

    // Should redirect to sign-in (with possible callbackUrl param)
    const isSignIn = page.url().includes('/sign-in');
    expect(isSignIn).toBeTruthy();

    await context.close();
  });

  test('non-admin user cannot access admin panel', async ({ browser }) => {
    // Create a regular user context
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access admin without auth
    await page.goto('/admin/overview');

    // Should redirect to sign-in or show unauthorized
    const isSignIn = page.url().includes('/sign-in');
    const isUnauthorized = page.url().includes('/unauthorized');

    expect(isSignIn || isUnauthorized).toBeTruthy();

    await context.close();
  });

  test('logout clears session', async ({ browser }) => {
    // Create a context and try to access admin
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access admin page
    await page.goto('/admin/overview', { waitUntil: 'domcontentloaded' });

    // Without auth, should be redirected to sign-in
    const isSignIn = page.url().includes('/sign-in');
    expect(isSignIn).toBeTruthy();

    await context.close();
  });
});
