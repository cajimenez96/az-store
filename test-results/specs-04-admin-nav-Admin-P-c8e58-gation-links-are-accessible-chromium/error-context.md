# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/04-admin-nav.spec.ts >> Admin Panel Navigation >> admin sidebar navigation links are accessible
- Location: tests/e2e/specs/04-admin-nav.spec.ts:174:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav').first()

```

```yaml
- link "Marder Hombres logo":
  - /url: /
  - img "Marder Hombres logo"
- text: Iniciar Sesión Ingresá a tu cuenta Correo electrónico
- textbox "Correo electrónico": admin@example.com
- text: Contraseña
- link "¿Olvidaste?":
  - /url: /forgot-password
- textbox "Contraseña": "123456"
- button "Iniciar Sesión"
- text: ¿No tenés una cuenta?
- link "Registrate":
  - /url: /sign-up
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
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
  118 |     const categoriesContent = page.locator('text=/categorías|categories/i').first();
  119 | 
  120 |     const hasContent = await categoriesContent.isVisible().catch(() => false);
  121 |     expect(hasContent).toBeTruthy();
  122 | 
  123 |     await context.close();
  124 |   });
  125 | 
  126 |   test('admin can navigate to brands page', async ({ browser }) => {
  127 |     const context = await browser.newContext({
  128 |       storageState: 'tests/e2e/.auth/admin.json',
  129 |     });
  130 |     const page = await context.newPage();
  131 | 
  132 |     // Navigate to brands
  133 |     await page.goto('/admin/brands');
  134 | 
  135 |     // Wait for page to load
  136 |     await page.waitForLoadState('networkidle');
  137 | 
  138 |     // Verify we're on the right page
  139 |     expect(page.url()).toContain('/admin/brands');
  140 | 
  141 |     // Check for page content
  142 |     const brandsContent = page.locator('text=/marcas|brands/i').first();
  143 | 
  144 |     const hasContent = await brandsContent.isVisible().catch(() => false);
  145 |     expect(hasContent).toBeTruthy();
  146 | 
  147 |     await context.close();
  148 |   });
  149 | 
  150 |   test('admin can navigate to users page', async ({ browser }) => {
  151 |     const context = await browser.newContext({
  152 |       storageState: 'tests/e2e/.auth/admin.json',
  153 |     });
  154 |     const page = await context.newPage();
  155 | 
  156 |     // Navigate to users
  157 |     await page.goto('/admin/users');
  158 | 
  159 |     // Wait for page to load
  160 |     await page.waitForLoadState('networkidle');
  161 | 
  162 |     // Verify we're on the right page
  163 |     expect(page.url()).toContain('/admin/users');
  164 | 
  165 |     // Check for page content
  166 |     const usersContent = page.locator('text=/usuarios|users/i').first();
  167 | 
  168 |     const hasContent = await usersContent.isVisible().catch(() => false);
  169 |     expect(hasContent).toBeTruthy();
  170 | 
  171 |     await context.close();
  172 |   });
  173 | 
  174 |   test('admin sidebar navigation links are accessible', async ({ browser }) => {
  175 |     const context = await browser.newContext({
  176 |       storageState: 'tests/e2e/.auth/admin.json',
  177 |     });
  178 |     const page = await context.newPage();
  179 | 
  180 |     // Navigate to any admin page
  181 |     await page.goto('/admin/overview');
  182 | 
  183 |     // Check for sidebar or navigation menu
  184 |     const sidebarNav = page.locator('nav').first();
> 185 |     await expect(sidebarNav).toBeVisible({ timeout: 5000 });
      |                              ^ Error: expect(locator).toBeVisible() failed
  186 | 
  187 |     // Verify key navigation links exist
  188 |     const hasProductsLink = await page.locator('a:has-text("Productos")').isVisible().catch(() => false) ||
  189 |                            await page.locator('a:has-text("Products")').isVisible().catch(() => false);
  190 |     const hasOrdersLink = await page.locator('a:has-text("Órdenes")').isVisible().catch(() => false) ||
  191 |                          await page.locator('a:has-text("Orders")').isVisible().catch(() => false);
  192 | 
  193 |     expect(hasProductsLink || hasOrdersLink).toBeTruthy();
  194 | 
  195 |     await context.close();
  196 |   });
  197 | });
  198 | 
```