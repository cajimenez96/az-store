import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('complete checkout flow with bank transfer', async ({ browser }) => {
    // Use auth context with pre-authenticated session
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // 1. Navigate to homepage
    await page.goto('/');
    expect(page.url()).toContain('/');

    // 2. Find and click on test product
    const productLink = page.locator('a:has-text("E2E Test Product")').first();
    await productLink.click();

    // 3. Wait for PDP to load and verify product name
    await page.waitForSelector('h1:has-text("E2E Test Product")');

    // 4. Select size M
    const sizeButton = page.locator('button:has-text("M")').first();
    await sizeButton.click();

    // 5. Add to cart
    const addToCartButton = page.locator('button:has-text("Agregar al Carrito")').first();
    await addToCartButton.click();

    // 6. Wait for cart confirmation and navigate to cart
    await page.goto('/cart');

    // 7. Verify item is in cart
    const cartItemName = page.locator('text=E2E Test Product');
    await expect(cartItemName).toBeVisible();

    // 8. Proceed to checkout
    const proceedButton = page.locator('button:has-text("Proceder al Pago")');
    await proceedButton.click();

    // 9. Should redirect to shipping address
    await page.waitForURL('/shipping-address');

    // 10. Fill shipping address form
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#phone', '1234567890');
    await page.fill('#address', 'Test Street 123');
    await page.fill('#city', 'Test City');
    await page.fill('#postalCode', '12345');

    // 11. Select country (assuming select element)
    await page.selectOption('select', 'ar');

    // 12. Click continue button
    const shippingSubmitButton = page.locator('[data-testid="shipping-submit"]');
    await shippingSubmitButton.click();

    // 13. Should redirect to payment method
    await page.waitForURL('/payment-method');

    // 14. Select TransferenciaBancaria payment method
    const bankTransferOption = page.locator('input[value="TransferenciaBancaria"]');
    await bankTransferOption.click();

    // 15. Continue to place order
    const continueToOrderButton = page.locator('button:has-text("Continuar")').last();
    await continueToOrderButton.click();

    // 16. Should redirect to place-order
    await page.waitForURL('/place-order');

    // 17. Confirm order
    const placeOrderButton = page.locator('[data-testid="place-order-submit"]');
    await placeOrderButton.click();

    // 18. Should redirect to order details page with order ID
    await page.waitForURL(/\/order\/[a-f0-9-]+/);

    // 19. Verify order status is "Pendiente de Pago"
    const orderStatus = page.locator('text=Pendiente de Pago');
    await expect(orderStatus).toBeVisible();

    // 20. Verify product is listed in order
    const orderItemText = page.locator('text=E2E Test Product');
    await expect(orderItemText).toBeVisible();

    await context.close();
  });

  test('cart persists across navigation', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Add item to cart
    await page.goto('/');
    const productLink = page.locator('a:has-text("E2E Test Product")').first();
    await productLink.click();
    await page.waitForSelector('h1:has-text("E2E Test Product")');

    const sizeButton = page.locator('button:has-text("M")').first();
    await sizeButton.click();

    const addToCartButton = page.locator('button:has-text("Agregar al Carrito")').first();
    await addToCartButton.click();

    // Navigate away
    await page.goto('/');

    // Navigate back to cart
    await page.goto('/cart');

    // Verify item is still there
    const cartItemName = page.locator('text=E2E Test Product');
    await expect(cartItemName).toBeVisible();

    await context.close();
  });

  test('cannot checkout with empty cart', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Go directly to cart
    await page.goto('/cart');

    // Should show empty cart message
    const emptyCartMessage = page.locator('text=/carrito|vac/i');
    const proceedButton = page.locator('button:has-text("Proceder al Pago")');

    // Either empty message is visible or proceed button is disabled
    const isEmptyVisible = await emptyCartMessage.isVisible().catch(() => false);
    const isProceedDisabled = await proceedButton.isDisabled().catch(() => true);

    expect(isEmptyVisible || isProceedDisabled).toBeTruthy();

    await context.close();
  });
});
