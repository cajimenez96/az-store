# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/01-auth.spec.ts >> Authentication >> successful login with default credentials
- Location: tests/e2e/specs/01-auth.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 30000ms exceeded.
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
      - generic [ref=e23]: Correo o contraseña incorrectos
      - generic [ref=e24]:
        - text: ¿No tenés una cuenta?
        - link "Registrate" [ref=e25] [cursor=pointer]:
          - /url: /sign-up
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e35]
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
  14 |     // Wait for redirect (away from /sign-in)
> 15 |     await page.waitForFunction(
     |                ^ Error: page.waitForFunction: Test timeout of 30000ms exceeded.
  16 |       () => !window.location.pathname.includes('sign-in'),
  17 |       { timeout: 10000 }
  18 |     );
  19 | 
  20 |     // Should not be on sign-in page anymore
  21 |     expect(!page.url().includes('sign-in')).toBeTruthy();
  22 |   });
  23 | 
  24 |   test('failed login with incorrect password', async ({ page }) => {
  25 |     await page.goto('/sign-in');
  26 | 
  27 |     // Fill with wrong password
  28 |     await page.fill('#email', 'admin@example.com');
  29 |     await page.fill('#password', 'wrongpassword');
  30 | 
  31 |     // Submit
  32 |     await page.click('button:has-text("Iniciar Sesión")');
  33 | 
  34 |     // Should show error message
  35 |     const errorMessage = page.locator('.text-destructive');
  36 |     await expect(errorMessage).toBeVisible();
  37 |   });
  38 | 
  39 |   test('protected route redirects to login when not authenticated', async ({
  40 |     browser,
  41 |   }) => {
  42 |     // Create a context without authentication
  43 |     const context = await browser.newContext();
  44 |     const page = await context.newPage();
  45 | 
  46 |     // Try to access protected route
  47 |     await page.goto('/shipping-address', { waitUntil: 'domcontentloaded' });
  48 | 
  49 |     // Should redirect to sign-in (with possible callbackUrl param)
  50 |     const isSignIn = page.url().includes('/sign-in');
  51 |     expect(isSignIn).toBeTruthy();
  52 | 
  53 |     await context.close();
  54 |   });
  55 | 
  56 |   test('non-admin user cannot access admin panel', async ({ browser }) => {
  57 |     // Create a regular user context
  58 |     const context = await browser.newContext();
  59 |     const page = await context.newPage();
  60 | 
  61 |     // Try to access admin without auth
  62 |     await page.goto('/admin/overview');
  63 | 
  64 |     // Should redirect to sign-in or show unauthorized
  65 |     const isSignIn = page.url().includes('/sign-in');
  66 |     const isUnauthorized = page.url().includes('/unauthorized');
  67 | 
  68 |     expect(isSignIn || isUnauthorized).toBeTruthy();
  69 | 
  70 |     await context.close();
  71 |   });
  72 | 
  73 |   test('logout clears session', async ({ browser }) => {
  74 |     // Create a context and try to access admin
  75 |     const context = await browser.newContext();
  76 |     const page = await context.newPage();
  77 | 
  78 |     // Try to access admin page
  79 |     await page.goto('/admin/overview', { waitUntil: 'domcontentloaded' });
  80 | 
  81 |     // Without auth, should be redirected to sign-in
  82 |     const isSignIn = page.url().includes('/sign-in');
  83 |     expect(isSignIn).toBeTruthy();
  84 | 
  85 |     await context.close();
  86 |   });
  87 | });
  88 | 
```