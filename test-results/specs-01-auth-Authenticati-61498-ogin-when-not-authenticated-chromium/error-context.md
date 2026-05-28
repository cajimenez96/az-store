# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/01-auth.spec.ts >> Authentication >> protected route redirects to login when not authenticated
- Location: tests/e2e/specs/01-auth.spec.ts:34:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 5000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/sign-in" until "load"
  navigated to "http://localhost:3000/sign-in?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fshipping-address"
============================================================
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   test('successful login with default credentials', async ({ page }) => {
  5  |     await page.goto('/sign-in');
  6  | 
  7  |     // Fill with correct credentials
  8  |     await page.fill('#email', 'admin@example.com');
  9  |     await page.fill('#password', '123456');
  10 | 
  11 |     // Submit login
  12 |     await page.click('button:has-text("Iniciar Sesión")');
  13 | 
  14 |     // Should redirect to home
  15 |     await page.waitForURL('/', { timeout: 10000 });
  16 |     expect(page.url()).toContain('localhost:3000');
  17 |   });
  18 | 
  19 |   test('failed login with incorrect password', async ({ page }) => {
  20 |     await page.goto('/sign-in');
  21 | 
  22 |     // Fill with wrong password
  23 |     await page.fill('#email', 'admin@example.com');
  24 |     await page.fill('#password', 'wrongpassword');
  25 | 
  26 |     // Submit
  27 |     await page.click('button:has-text("Iniciar Sesión")');
  28 | 
  29 |     // Should show error message
  30 |     const errorMessage = page.locator('.text-destructive');
  31 |     await expect(errorMessage).toBeVisible();
  32 |   });
  33 | 
  34 |   test('protected route redirects to login when not authenticated', async ({
  35 |     browser,
  36 |   }) => {
  37 |     // Create a context without authentication
  38 |     const context = await browser.newContext();
  39 |     const page = await context.newPage();
  40 | 
  41 |     // Try to access protected route
  42 |     await page.goto('/shipping-address');
  43 | 
  44 |     // Should redirect to sign-in
> 45 |     await page.waitForURL('/sign-in', { timeout: 5000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 5000ms exceeded.
  46 |     expect(page.url()).toContain('/sign-in');
  47 | 
  48 |     await context.close();
  49 |   });
  50 | 
  51 |   test('non-admin user cannot access admin panel', async ({ browser }) => {
  52 |     // Create a regular user context
  53 |     const context = await browser.newContext();
  54 |     const page = await context.newPage();
  55 | 
  56 |     // Try to access admin without auth
  57 |     await page.goto('/admin/overview');
  58 | 
  59 |     // Should redirect to sign-in or show unauthorized
  60 |     const isSignIn = page.url().includes('/sign-in');
  61 |     const isUnauthorized = page.url().includes('/unauthorized');
  62 | 
  63 |     expect(isSignIn || isUnauthorized).toBeTruthy();
  64 | 
  65 |     await context.close();
  66 |   });
  67 | 
  68 |   test('logout clears session', async ({ browser }) => {
  69 |     // Start authenticated (in a fresh context for this test)
  70 |     const context = await browser.newContext({
  71 |       storageState: 'tests/e2e/.auth/admin.json',
  72 |     });
  73 |     const page = await context.newPage();
  74 | 
  75 |     await page.goto('/');
  76 | 
  77 |     // Verify we can access admin (authenticated)
  78 |     await page.goto('/admin/overview', { timeout: 5000 });
  79 |     expect(page.url()).toContain('/admin');
  80 | 
  81 |     await context.close();
  82 |   });
  83 | });
  84 | 
```