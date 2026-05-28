import { test, expect } from '@playwright/test';

test.describe('Admin Panel Navigation', () => {
  test('admin can navigate to overview page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to admin overview
    await page.goto('/admin/overview');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    expect(page.url()).toContain('/admin/overview');

    // Check for dashboard title
    const dashboardTitle = page.locator('h1, h2').filter({ hasText: /panel|control|dashboard|overview/i }).first();
    await expect(dashboardTitle).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('admin can navigate to products page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to products
    await page.goto('/admin/products');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    expect(page.url()).toContain('/admin/products');

    // Check for page content (table or product list)
    const productsContent = page.locator('text=/productos|inventario/i').first();
    await expect(productsContent).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('admin can navigate to promotions page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to promotions
    await page.goto('/admin/promotions');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    expect(page.url()).toContain('/admin/promotions');

    // Check for page content
    const promotionsContent = page.locator('text=/promociones|banners/i').first();
    const pageTitle = page.locator('h1, h2').first();

    const hasContent = await promotionsContent.isVisible().catch(() => false) ||
                      await pageTitle.isVisible().catch(() => false);

    expect(hasContent).toBeTruthy();

    await context.close();
  });

  test('admin can navigate to orders page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to orders
    await page.goto('/admin/orders');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    expect(page.url()).toContain('/admin/orders');

    // Check for page content
    const ordersContent = page.locator('text=/órdenes|orders|pedidos/i').first();
    const pageTitle = page.locator('h1, h2').first();

    const hasContent = await ordersContent.isVisible().catch(() => false) ||
                      await pageTitle.isVisible().catch(() => false);

    expect(hasContent).toBeTruthy();

    await context.close();
  });

  test('admin can navigate to categories page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to categories
    await page.goto('/admin/categories');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    expect(page.url()).toContain('/admin/categories');

    // Check for page content
    const categoriesContent = page.locator('text=/categorías|categories/i').first();

    const hasContent = await categoriesContent.isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();

    await context.close();
  });

  test('admin can navigate to brands page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to brands
    await page.goto('/admin/brands');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    expect(page.url()).toContain('/admin/brands');

    // Check for page content
    const brandsContent = page.locator('text=/marcas|brands/i').first();

    const hasContent = await brandsContent.isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();

    await context.close();
  });

  test('admin can navigate to users page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to users
    await page.goto('/admin/users');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    expect(page.url()).toContain('/admin/users');

    // Check for page content
    const usersContent = page.locator('text=/usuarios|users/i').first();

    const hasContent = await usersContent.isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();

    await context.close();
  });

  test('admin sidebar navigation links are accessible', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to any admin page
    await page.goto('/admin/overview');

    // Check for sidebar or navigation menu
    const sidebarNav = page.locator('nav').first();
    await expect(sidebarNav).toBeVisible({ timeout: 5000 });

    // Verify key navigation links exist
    const hasProductsLink = await page.locator('a:has-text("Productos")').isVisible().catch(() => false) ||
                           await page.locator('a:has-text("Products")').isVisible().catch(() => false);
    const hasOrdersLink = await page.locator('a:has-text("Órdenes")').isVisible().catch(() => false) ||
                         await page.locator('a:has-text("Orders")').isVisible().catch(() => false);

    expect(hasProductsLink || hasOrdersLink).toBeTruthy();

    await context.close();
  });
});
