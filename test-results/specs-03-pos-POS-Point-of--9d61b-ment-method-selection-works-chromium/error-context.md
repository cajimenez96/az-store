# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/03-pos.spec.ts >> POS (Point of Sale) >> POS payment method selection works
- Location: tests/e2e/specs/03-pos.spec.ts:110:7

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
  27  |     // Select size M
  28  |     const sizeOption = page.locator('button:has-text("M")');
  29  |     await sizeOption.click();
  30  | 
  31  |     // Increment quantity using pos-item-inc button
  32  |     const incrementButton = page.locator('[data-testid="pos-item-inc"]').first();
  33  |     await incrementButton.click();
  34  | 
  35  |     // Verify quantity increased
  36  |     await expect(incrementButton).toBeVisible();
  37  | 
  38  |     // Select payment method - Efectivo (Cash)
  39  |     const efectivoOption = page.locator('input[value="Efectivo"]');
  40  |     if (await efectivoOption.isVisible()) {
  41  |       await efectivoOption.click();
  42  |     }
  43  | 
  44  |     // Register sale
  45  |     const registerSaleButton = page.locator('#pos-register-sale');
  46  |     await registerSaleButton.click();
  47  | 
  48  |     // Wait for success modal
  49  |     const successModal = page.locator('text=/venta registrada|éxito/i');
  50  |     await expect(successModal).toBeVisible({ timeout: 10000 });
  51  | 
  52  |     // Click "Nueva Venta" to reset cart
  53  |     const newSaleButton = page.locator('button:has-text("Nueva Venta")');
  54  |     await newSaleButton.click();
  55  | 
  56  |     // Wait for modal to close and cart to be empty
  57  |     await page.waitForSelector('[data-testid="pos-customer-search"]', { timeout: 5000 });
  58  | 
  59  |     await context.close();
  60  |   });
  61  | 
  62  |   test('POS cart quantity controls work', async ({ browser }) => {
  63  |     const context = await browser.newContext({
  64  |       storageState: 'tests/e2e/.auth/admin.json',
  65  |     });
  66  |     const page = await context.newPage();
  67  | 
  68  |     // Navigate to POS
  69  |     await page.goto('/admin/pos');
  70  | 
  71  |     // Wait for POS page to load
  72  |     await page.waitForSelector('text=/punto de venta|pos/i', { timeout: 10000 });
  73  | 
  74  |     // Search for test product
  75  |     const customerSearchInput = page.locator('[data-testid="pos-customer-search"]');
  76  |     await customerSearchInput.fill('E2E Test Product');
  77  | 
  78  |     // Click on product
  79  |     const productResult = page.locator('text=E2E Test Product').first();
  80  |     await productResult.click();
  81  | 
  82  |     // Select size M
  83  |     const sizeOption = page.locator('button:has-text("M")');
  84  |     await sizeOption.click();
  85  | 
  86  |     // Get initial quantity (should be 1)
  87  |     const quantityDisplay = page.locator('input[type="number"]').first();
  88  |     const initialQty = await quantityDisplay.inputValue();
  89  | 
  90  |     // Click increment multiple times
  91  |     const incrementButton = page.locator('[data-testid="pos-item-inc"]').first();
  92  |     await incrementButton.click();
  93  |     await incrementButton.click();
  94  | 
  95  |     // Verify quantity increased
  96  |     const newQty = await quantityDisplay.inputValue();
  97  |     expect(parseInt(newQty) > parseInt(initialQty || '0')).toBeTruthy();
  98  | 
  99  |     // Click decrement
  100 |     const decrementButton = page.locator('[data-testid="pos-item-dec"]').first();
  101 |     await decrementButton.click();
  102 | 
  103 |     // Verify quantity decreased
  104 |     const decrementedQty = await quantityDisplay.inputValue();
  105 |     expect(parseInt(decrementedQty) === parseInt(newQty) - 1 || parseInt(decrementedQty) === 0).toBeTruthy();
  106 | 
  107 |     await context.close();
  108 |   });
  109 | 
  110 |   test('POS payment method selection works', async ({ browser }) => {
  111 |     const context = await browser.newContext({
  112 |       storageState: 'tests/e2e/.auth/admin.json',
  113 |     });
  114 |     const page = await context.newPage();
  115 | 
  116 |     // Navigate to POS
  117 |     await page.goto('/admin/pos');
  118 | 
  119 |     // Wait for payment method options
  120 |     const efectivoOption = page.locator('input[value="Efectivo"]');
  121 |     const transferOption = page.locator('input[value="Transferencia"]');
  122 | 
  123 |     // Verify payment methods are available
  124 |     const hasPaymentOptions = await efectivoOption.isVisible().catch(() => false) ||
  125 |                              await transferOption.isVisible().catch(() => false);
  126 | 
> 127 |     expect(hasPaymentOptions).toBeTruthy();
      |                               ^ Error: expect(received).toBeTruthy()
  128 | 
  129 |     // Select Efectivo
  130 |     if (await efectivoOption.isVisible()) {
  131 |       await efectivoOption.click();
  132 |       await expect(efectivoOption).toBeChecked();
  133 |     }
  134 | 
  135 |     await context.close();
  136 |   });
  137 | });
  138 | 
```