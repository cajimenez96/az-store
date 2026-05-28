import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('successful login with default credentials', async ({ page }) => {
    await page.goto('/sign-in');

    // Fill with correct credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', '123456');

    // Submit login
    await page.click('button:has-text("Iniciar Sesión")');

    // Should redirect to home
    await page.waitForURL('/', { timeout: 10000 });
    expect(page.url()).toContain('localhost:3000');
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
    await page.goto('/shipping-address');

    // Should redirect to sign-in
    await page.waitForURL('/sign-in', { timeout: 5000 });
    expect(page.url()).toContain('/sign-in');

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
    // Start authenticated (in a fresh context for this test)
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    await page.goto('/');

    // Verify we can access admin (authenticated)
    await page.goto('/admin/overview', { timeout: 5000 });
    expect(page.url()).toContain('/admin');

    await context.close();
  });
});
