# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/02-checkout.spec.ts >> Checkout Flow >> cart shows added items
- Location: tests/e2e/specs/02-checkout.spec.ts:31:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - img "AZ Store" [ref=e3]
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e12] [cursor=pointer]:
    - img [ref=e13]
  - alert [ref=e16]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Checkout Flow', () => {
  4  |   test('add product to cart', async ({ page }) => {
  5  |     // 1. Navigate to homepage
  6  |     await page.goto('/');
  7  | 
  8  |     // 2. Find and click on test product
  9  |     const productLink = page.locator('a:has-text("E2E Test Product")').first();
  10 |     if (!(await productLink.isVisible())) {
  11 |       test.skip();
  12 |     }
  13 |     await productLink.click();
  14 | 
  15 |     // 3. Wait for PDP to load
  16 |     await page.waitForSelector('text=E2E Test Product', { timeout: 10000 });
  17 | 
  18 |     // 4. Select size M if available
  19 |     const sizeButton = page.locator('button:has-text("M")').first();
  20 |     if (await sizeButton.isVisible()) {
  21 |       await sizeButton.click();
  22 |     }
  23 | 
  24 |     // 5. Add to cart
  25 |     const addToCartButton = page.locator('button:has-text("Agregar al Carrito")').first();
  26 |     if (await addToCartButton.isVisible()) {
  27 |       await addToCartButton.click();
  28 |     }
  29 |   });
  30 | 
  31 |   test('cart shows added items', async ({ page }) => {
  32 |     // Go to cart
  33 |     await page.goto('/cart');
  34 | 
  35 |     // Check if cart has content or is empty
  36 |     const cartContent = await page.locator('text=E2E Test Product').isVisible().catch(() => false);
  37 |     const cartEmpty = await page.locator('text=/carrito|vac/i').isVisible().catch(() => false);
  38 | 
> 39 |     expect(cartContent || cartEmpty).toBeTruthy();
     |                                      ^ Error: expect(received).toBeTruthy()
  40 |   });
  41 | 
  42 |   test('cannot checkout with empty cart', async ({ page }) => {
  43 |     // Go directly to cart
  44 |     await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  45 | 
  46 |     // Just verify we can access the cart page
  47 |     expect(page.url()).toContain('/cart');
  48 |   });
  49 | });
  50 | 
```