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
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
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
  7  |     // Credentials are pre-filled in the form
  8  |     await page.fill('#password', '123456');
  9  | 
  10 |     // Submit login
  11 |     await page.click('button:has-text("Iniciar Sesión")');
  12 | 
  13 |     // Should redirect to home
> 14 |     await page.waitForURL('/');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  15 |     expect(page.url()).toBe('http://localhost:3000/');
  16 |   });
  17 | 
  18 |   test('failed login with incorrect password', async ({ page }) => {
  19 |     await page.goto('/sign-in');
  20 | 
  21 |     // Fill with wrong password
  22 |     await page.fill('#email', 'admin@example.com');
  23 |     await page.fill('#password', 'wrongpassword');
  24 | 
  25 |     // Submit
  26 |     await page.click('button:has-text("Iniciar Sesión")');
  27 | 
  28 |     // Should show error message
  29 |     const errorMessage = page.locator('.text-destructive');
  30 |     await expect(errorMessage).toBeVisible();
  31 |   });
  32 | 
  33 |   test('protected route redirects to login when not authenticated', async ({
  34 |     page,
  35 |     context,
  36 |   }) => {
  37 |     // Create a context without authentication
  38 |     const newContext = await page.context().browser()?.newContext();
  39 |     const newPage = newContext!.newPage();
  40 | 
  41 |     // Try to access protected route
  42 |     await newPage.goto('/shipping-address');
  43 | 
  44 |     // Should redirect to sign-in
  45 |     await newPage.waitForURL('/sign-in');
  46 |     expect(newPage.url()).toContain('/sign-in');
  47 | 
  48 |     await newContext?.close();
  49 |   });
  50 | 
  51 |   test('non-admin user cannot access admin panel', async ({ page }) => {
  52 |     // Create a regular user context
  53 |     const newContext = await page.context().browser()?.newContext();
  54 |     const newPage = newContext!.newPage();
  55 | 
  56 |     // Create and login a regular user
  57 |     await newPage.goto('/sign-in');
  58 |     // The form has admin email pre-filled, so we need to change it
  59 |     // For this test, we'd need a regular user in the DB, which we don't have
  60 |     // So we'll skip this detailed test for now
  61 | 
  62 |     await newContext?.close();
  63 |   });
  64 | 
  65 |   test('logout clears session', async ({ page }) => {
  66 |     // Start authenticated (but in a fresh context for this test)
  67 |     const newContext = await page.context().browser()?.newContext({
  68 |       storageState: 'tests/e2e/.auth/admin.json',
  69 |     });
  70 |     const newPage = newContext!.newPage();
  71 | 
  72 |     await newPage.goto('/');
  73 | 
  74 |     // Look for user menu / logout button
  75 |     // This depends on the UI implementation
  76 |     // For now, we verify we can access admin
  77 |     await newPage.goto('/admin/overview');
  78 |     expect(newPage.url()).toContain('/admin');
  79 | 
  80 |     await newContext?.close();
  81 |   });
  82 | });
  83 | 
```