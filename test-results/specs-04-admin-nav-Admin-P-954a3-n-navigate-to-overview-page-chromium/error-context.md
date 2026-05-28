# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/04-admin-nav.spec.ts >> Admin Panel Navigation >> admin can navigate to overview page
- Location: tests/e2e/specs/04-admin-nav.spec.ts:4:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/admin/overview"
Received string:    "http://localhost:3000/sign-in?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fadmin%2Foverview"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - link "Marder Hombres logo" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "Marder Hombres logo" [ref=e7]
      - generic [ref=e8]: Iniciar Sesión
      - generic [ref=e9]: Ingresá a tu cuenta
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Correo electrónico
        - textbox "Correo electrónico" [ref=e15]: admin@example.com
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Contraseña
          - link "¿Olvidaste?" [ref=e19] [cursor=pointer]:
            - /url: /forgot-password
        - textbox "Contraseña" [ref=e20]: "123456"
      - button "Iniciar Sesión" [ref=e22] [cursor=pointer]
      - generic [ref=e23]:
        - text: ¿No tenés una cuenta?
        - link "Registrate" [ref=e24] [cursor=pointer]:
          - /url: /sign-up
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e30] [cursor=pointer]:
    - img [ref=e31]
  - alert [ref=e34]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Admin Panel Navigation', () => {
  4   |   test('admin can navigate to overview page', async ({ browser }) => {
  5   |     const context = await browser.newContext({
  6   |       storageState: 'tests/e2e/.auth/admin.json',
  7   |     });
  8   |     const page = await context.newPage();
  9   | 
  10  |     // Navigate to admin overview
  11  |     await page.goto('/admin/overview');
  12  | 
  13  |     // Wait for page to load
  14  |     await page.waitForLoadState('networkidle');
  15  | 
  16  |     // Verify we're on the right page
> 17  |     expect(page.url()).toContain('/admin/overview');
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  18  | 
  19  |     // Check for dashboard title
  20  |     const dashboardTitle = page.locator('h1, h2').filter({ hasText: /panel|control|dashboard|overview/i }).first();
  21  |     await expect(dashboardTitle).toBeVisible({ timeout: 5000 });
  22  | 
  23  |     await context.close();
  24  |   });
  25  | 
  26  |   test('admin can navigate to products page', async ({ browser }) => {
  27  |     const context = await browser.newContext({
  28  |       storageState: 'tests/e2e/.auth/admin.json',
  29  |     });
  30  |     const page = await context.newPage();
  31  | 
  32  |     // Navigate to products
  33  |     await page.goto('/admin/products');
  34  | 
  35  |     // Wait for page to load
  36  |     await page.waitForLoadState('networkidle');
  37  | 
  38  |     // Verify we're on the right page
  39  |     expect(page.url()).toContain('/admin/products');
  40  | 
  41  |     // Check for page content (table or product list)
  42  |     const productsContent = page.locator('text=/productos|inventario/i').first();
  43  |     await expect(productsContent).toBeVisible({ timeout: 5000 });
  44  | 
  45  |     await context.close();
  46  |   });
  47  | 
  48  |   test('admin can navigate to promotions page', async ({ browser }) => {
  49  |     const context = await browser.newContext({
  50  |       storageState: 'tests/e2e/.auth/admin.json',
  51  |     });
  52  |     const page = await context.newPage();
  53  | 
  54  |     // Navigate to promotions
  55  |     await page.goto('/admin/promotions');
  56  | 
  57  |     // Wait for page to load
  58  |     await page.waitForLoadState('networkidle');
  59  | 
  60  |     // Verify we're on the right page
  61  |     expect(page.url()).toContain('/admin/promotions');
  62  | 
  63  |     // Check for page content
  64  |     const promotionsContent = page.locator('text=/promociones|banners/i').first();
  65  |     const pageTitle = page.locator('h1, h2').first();
  66  | 
  67  |     const hasContent = await promotionsContent.isVisible().catch(() => false) ||
  68  |                       await pageTitle.isVisible().catch(() => false);
  69  | 
  70  |     expect(hasContent).toBeTruthy();
  71  | 
  72  |     await context.close();
  73  |   });
  74  | 
  75  |   test('admin can navigate to orders page', async ({ browser }) => {
  76  |     const context = await browser.newContext({
  77  |       storageState: 'tests/e2e/.auth/admin.json',
  78  |     });
  79  |     const page = await context.newPage();
  80  | 
  81  |     // Navigate to orders
  82  |     await page.goto('/admin/orders');
  83  | 
  84  |     // Wait for page to load
  85  |     await page.waitForLoadState('networkidle');
  86  | 
  87  |     // Verify we're on the right page
  88  |     expect(page.url()).toContain('/admin/orders');
  89  | 
  90  |     // Check for page content
  91  |     const ordersContent = page.locator('text=/órdenes|orders|pedidos/i').first();
  92  |     const pageTitle = page.locator('h1, h2').first();
  93  | 
  94  |     const hasContent = await ordersContent.isVisible().catch(() => false) ||
  95  |                       await pageTitle.isVisible().catch(() => false);
  96  | 
  97  |     expect(hasContent).toBeTruthy();
  98  | 
  99  |     await context.close();
  100 |   });
  101 | 
  102 |   test('admin can navigate to categories page', async ({ browser }) => {
  103 |     const context = await browser.newContext({
  104 |       storageState: 'tests/e2e/.auth/admin.json',
  105 |     });
  106 |     const page = await context.newPage();
  107 | 
  108 |     // Navigate to categories
  109 |     await page.goto('/admin/categories');
  110 | 
  111 |     // Wait for page to load
  112 |     await page.waitForLoadState('networkidle');
  113 | 
  114 |     // Verify we're on the right page
  115 |     expect(page.url()).toContain('/admin/categories');
  116 | 
  117 |     // Check for page content
```