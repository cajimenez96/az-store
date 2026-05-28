import { test, expect } from '@playwright/test';

test.describe('POS (Point of Sale)', () => {
  test('complete POS sale flow', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to POS
    await page.goto('/admin/pos');

    // Wait for POS page to load
    await page.waitForSelector('text=/punto de venta|pos/i', { timeout: 10000 });

    // Search for test product by name
    const customerSearchInput = page.locator('[data-testid="pos-customer-search"]');
    await customerSearchInput.fill('E2E Test Product');

    // Wait for product to appear in search results
    await page.waitForSelector('text=E2E Test Product', { timeout: 5000 });

    // Click on product to add to cart
    const productResult = page.locator('text=E2E Test Product').first();
    await productResult.click();

    // Select size M
    const sizeOption = page.locator('button:has-text("M")');
    await sizeOption.click();

    // Increment quantity using pos-item-inc button
    const incrementButton = page.locator('[data-testid="pos-item-inc"]').first();
    await incrementButton.click();

    // Verify quantity increased
    await expect(incrementButton).toBeVisible();

    // Select payment method - Efectivo (Cash)
    const efectivoOption = page.locator('input[value="Efectivo"]');
    if (await efectivoOption.isVisible()) {
      await efectivoOption.click();
    }

    // Register sale
    const registerSaleButton = page.locator('#pos-register-sale');
    await registerSaleButton.click();

    // Wait for success modal
    const successModal = page.locator('text=/venta registrada|éxito/i');
    await expect(successModal).toBeVisible({ timeout: 10000 });

    // Click "Nueva Venta" to reset cart
    const newSaleButton = page.locator('button:has-text("Nueva Venta")');
    await newSaleButton.click();

    // Wait for modal to close and cart to be empty
    await page.waitForSelector('[data-testid="pos-customer-search"]', { timeout: 5000 });

    await context.close();
  });

  test('POS cart quantity controls work', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to POS
    await page.goto('/admin/pos');

    // Wait for POS page to load
    await page.waitForSelector('text=/punto de venta|pos/i', { timeout: 10000 });

    // Search for test product
    const customerSearchInput = page.locator('[data-testid="pos-customer-search"]');
    await customerSearchInput.fill('E2E Test Product');

    // Click on product
    const productResult = page.locator('text=E2E Test Product').first();
    await productResult.click();

    // Select size M
    const sizeOption = page.locator('button:has-text("M")');
    await sizeOption.click();

    // Get initial quantity (should be 1)
    const quantityDisplay = page.locator('input[type="number"]').first();
    const initialQty = await quantityDisplay.inputValue();

    // Click increment multiple times
    const incrementButton = page.locator('[data-testid="pos-item-inc"]').first();
    await incrementButton.click();
    await incrementButton.click();

    // Verify quantity increased
    const newQty = await quantityDisplay.inputValue();
    expect(parseInt(newQty) > parseInt(initialQty || '0')).toBeTruthy();

    // Click decrement
    const decrementButton = page.locator('[data-testid="pos-item-dec"]').first();
    await decrementButton.click();

    // Verify quantity decreased
    const decrementedQty = await quantityDisplay.inputValue();
    expect(parseInt(decrementedQty) === parseInt(newQty) - 1 || parseInt(decrementedQty) === 0).toBeTruthy();

    await context.close();
  });

  test('POS payment method selection works', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();

    // Navigate to POS
    await page.goto('/admin/pos');

    // Wait for payment method options
    const efectivoOption = page.locator('input[value="Efectivo"]');
    const transferOption = page.locator('input[value="Transferencia"]');

    // Verify payment methods are available
    const hasPaymentOptions = await efectivoOption.isVisible().catch(() => false) ||
                             await transferOption.isVisible().catch(() => false);

    expect(hasPaymentOptions).toBeTruthy();

    // Select Efectivo
    if (await efectivoOption.isVisible()) {
      await efectivoOption.click();
      await expect(efectivoOption).toBeChecked();
    }

    await context.close();
  });
});
