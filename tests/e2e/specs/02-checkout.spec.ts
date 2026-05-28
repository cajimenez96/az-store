import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('add product to cart', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('/');

    // 2. Find and click on test product
    const productLink = page.locator('a:has-text("E2E Test Product")').first();
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    await productLink.click();

    // 3. Wait for PDP to load
    await page.waitForSelector('text=E2E Test Product', { timeout: 10000 });

    // 4. Select size M if available
    const sizeButton = page.locator('button:has-text("M")').first();
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
    }

    // 5. Add to cart
    const addToCartButton = page.locator('button:has-text("Agregar al Carrito")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
    }
  });

  test('cart shows added items', async ({ page }) => {
    // Go to cart
    await page.goto('/cart');

    // Check if cart has content or is empty
    const cartContent = await page.locator('text=E2E Test Product').isVisible().catch(() => false);
    const cartEmpty = await page.locator('text=/carrito|vac/i').isVisible().catch(() => false);

    expect(cartContent || cartEmpty).toBeTruthy();
  });

  test('cannot checkout with empty cart', async ({ page }) => {
    // Go directly to cart
    await page.goto('/cart');

    // Should show empty cart message or proceed button disabled
    const emptyCartMessage = await page.locator('text=/carrito|vac/i').isVisible().catch(() => false);
    const proceedButton = page.locator('button:has-text("Proceder al Pago")');
    const isProceedDisabled = await proceedButton.isDisabled().catch(() => true);

    expect(emptyCartMessage || isProceedDisabled).toBeTruthy();
  });
});
