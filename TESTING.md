# TESTING.md — Sprint v2.1.0 QA & E2E Test Guide

## Overview

Sprint v2.1.0 introduces 4 integrated features across production:
- **Phase 6.7**: Abandoned Cart Recovery (email + cron jobs)
- **Phase 6.10**: Promotional Banner (admin UI + storefront display)
- **Phase 6.8**: ISR + Performance (homepage caching + bundle optimization)
- **Phase 6.11**: E2E Tests with Playwright (18 test suite)

---

## Environment Setup

### Prerequisites
- Node.js 20+ (or bun 1.0+)
- PostgreSQL 14+ with `az_store` database
- `.env.test` configured for test database `az_store_test`

### Installation

```bash
# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install chromium

# Run migrations (see Migrations section below)
bun run prisma migrate deploy
```

---

## Running Tests

### Unit/Integration Tests
```bash
# Jest unit tests
bun run test

# Watch mode
bun run test:watch

# Integration tests (real DB)
bun run test:integration
bun run test:integration:watch
```

### E2E Tests (Playwright)

**Requirements:**
- Dev server running on `http://localhost:3000`
- `.env` file with `DATABASE_URL` pointing to test or development database

```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Run E2E tests
bun run test:e2e

# UI mode (interactive)
bun run test:e2e:ui

# Debug mode (step through)
bun run test:e2e:debug
```

**Test Specs:**
- `tests/e2e/specs/01-auth.spec.ts` — Authentication & route protection (5 tests)
- `tests/e2e/specs/02-checkout.spec.ts` — Checkout flow navigation (3 tests)
- `tests/e2e/specs/03-pos.spec.ts` — POS sales UI & form elements (3 tests)
- `tests/e2e/specs/04-admin-nav.spec.ts` — Admin panel routing (7 tests)

---

## QA Test Cases

### Phase 6.7 — Abandoned Cart Recovery

#### Test: Cart Recovery Email Trigger
**Preconditions:** Development environment with Resend email API configured

**Steps:**
1. Create a test user via `/sign-up`
2. Add items to cart (qty ≥ 1)
3. Wait 1+ hour (or mock system time)
4. Cron job `/api/cron/detect-abandoned-carts` runs
5. Verify email sent via Resend API logs or test inbox

**Expected:**
- Email arrives within 5 minutes of cron execution
- Email contains recovery link with valid JWT token
- Token includes `cartId` and expiration (7 days)

#### Test: Cart Recovery Link Validation
**Steps:**
1. Get recovery token from abandoned cart email
2. Navigate to `/api/cart-recovery?token=<TOKEN>`
3. Verify returned cart data (items, quantities, prices)
4. Click "Recover Cart" button if on UI
5. Verify session is created and cart is populated

**Expected:**
- 200 response with cart JSON or redirect to `/cart`
- Cart items restore with original product data
- `recoveredAt` timestamp updated in `CartRecovery` table

#### Test: Recovery Token Expiration
**Steps:**
1. Create expired recovery token (past `expiresAt`)
2. Try to use token in `/api/cart-recovery`
3. Verify error response

**Expected:**
- 400 or 403 error
- Message: "Recovery link expired"
- User offered option to request new recovery email

---

### Phase 6.10 — Promotional Banner

#### Test: Admin Creates & Publishes Promotion
**Path:** `/admin/promotions` → "Crear Promoción"

**Steps:**
1. Fill promotion form:
   - Title: "Summer Sale 2026"
   - Subtitle: "50% off select items"
   - Link URL: `/products?category=summer`
   - Link Label: "Shop Now"
   - Background Color: #FF6B6B (red)
   - Text Color: #FFFFFF (white)
2. Set `startsAt`: today
3. Set `endsAt`: 30 days from now
4. Click "Crear"

**Expected:**
- Promotion saved with status "Activa"
- Listed in `/admin/promotions` table
- Banner appears on homepage immediately

#### Test: Banner Display on Storefront
**Path:** Homepage `/`

**Steps:**
1. Navigate to homepage
2. Look for promotional banner above header
3. Verify colors, text, and link

**Expected:**
- Banner visible if promotion is within `startsAt`/`endsAt` window
- Banner hidden if promotion is inactive or expired
- Click link navigates to correct product category

#### Test: Promotion Status Badges
**Path:** `/admin/promotions`

**Steps:**
1. Create promotion with:
   - `startsAt`: 2 days in future
   - `endsAt`: 30 days from now
2. Verify status badge in list

**Expected Statuses:**
- **Pendiente**: `startsAt` is in the future (yellow badge)
- **Activa**: within `startsAt` and `endsAt` (green badge)
- **Expirada**: `endsAt` is in the past (gray badge)
- **Inactiva**: `isActive` = false (gray badge)

---

### Phase 6.8 — ISR + Performance

#### Test: Homepage Cache Invalidation (1 hour ISR)
**Path:** Homepage `/`

**Steps:**
1. Check homepage load time (DevTools Network tab)
2. Add new product to featured list in admin
3. Reload homepage immediately
4. Verify new product NOT visible (ISR revalidation hasn't run)
5. Wait 1 hour
6. Reload homepage
7. Verify new product is visible

**Expected:**
- First reload: ~200ms (from cache)
- Products don't update instantly (ISR window = 1 hour)
- Products update within 60 minutes of change
- No full page regeneration on each request

#### Test: Bundle Size
**Command:**
```bash
bun run analyze
```

**Expected:**
- Main bundle < 500KB (gzip)
- Recharts library lazy-loaded (not in main bundle)
- Initial page load ≤ 2 seconds (3G network)

#### Test: Category/Product Query Caching
**Path:** Homepage `/`

**Steps:**
1. Open DevTools Network tab
2. Reload homepage
3. Count database queries (check server logs)
4. Reload homepage again
5. Count database queries

**Expected:**
- First load: 3 queries (categories, latest products, featured products)
- Subsequent reloads within 1 hour: 0 queries (unstable_cache hit)
- After 1 hour: queries repeat (cache invalidation)

---

### Phase 6.11 — E2E Tests

#### Test Suite: Authentication (5 tests)
```bash
bun run test:e2e -- --grep "Authentication"
```

**Tests:**
1. ✓ Successful login with default credentials
2. ✓ Failed login with incorrect password
3. ✓ Protected route redirects to login when not authenticated
4. ✓ Non-admin user cannot access admin panel
5. ✓ Logout clears session

**Acceptance Criteria:**
- All 5 tests pass
- No timeouts
- Screenshots show correct pages/redirects

#### Test Suite: Checkout Flow (3 tests)
```bash
bun run test:e2e -- --grep "Checkout"
```

**Tests:**
1. ✓ Add product to cart
2. ✓ Cart shows added items
3. ✓ Cannot checkout with empty cart

**Acceptance Criteria:**
- All 3 tests pass
- Cart page loads successfully
- Empty cart handling works

#### Test Suite: POS (3 tests)
```bash
bun run test:e2e -- --grep "POS"
```

**Tests:**
1. ✓ POS page is accessible
2. ✓ POS form elements are present when accessible
3. ✓ Payment method options are present when on POS

**Acceptance Criteria:**
- All 3 tests pass
- POS page loads without auth issues
- Form elements render correctly

#### Test Suite: Admin Navigation (7 tests)
```bash
bun run test:e2e -- --grep "Admin Panel"
```

**Tests:**
- ✓ Can navigate to `/admin/overview`
- ✓ Can navigate to `/admin/products`
- ✓ Can navigate to `/admin/promotions`
- ✓ Can navigate to `/admin/orders`
- ✓ Can navigate to `/admin/categories`
- ✓ Can navigate to `/admin/brands`
- ✓ Can navigate to `/admin/users`

**Acceptance Criteria:**
- All 7 tests pass
- Each admin page loads or redirects appropriately
- Routes are protected (unauthenticated users see `/sign-in`)

---

## Production Deployment Checklist

Before deploying to Vercel:

- [ ] All E2E tests pass: `bun run test:e2e`
- [ ] Integration tests pass: `bun run test:integration`
- [ ] No TypeScript errors: `bun run lint`
- [ ] Bundle size analyzed: `bun run analyze`
- [ ] Migrations applied: `bun run prisma migrate deploy`
- [ ] `.env.production` configured:
  - `DATABASE_URL` → production PostgreSQL
  - `NEXTAUTH_SECRET` → strong random value
  - `RESEND_API_KEY` → Resend production key
  - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` → for rate limiting
  - `NEXTAUTH_URL` → production domain
- [ ] Cron secrets configured:
  - `CRON_SECRET` → strong random value (same in Vercel)
- [ ] MercadoPago credentials stored in admin settings (not env vars)
- [ ] All secrets added to Vercel environment variables
- [ ] Git commit with all changes: `git push origin main`

---

## Post-Deployment Verification

After deploying to Vercel:

### Test Production Domain
```bash
curl -I https://your-domain.com/
# Expected: 200 OK

curl -I https://your-domain.com/admin/overview
# Expected: 307/302 redirect to sign-in (unless authenticated)
```

### Verify Cron Jobs
```bash
# Check Vercel logs for cron execution
vercel logs --tail

# Expected: "🌱 Seeding test data..." at scheduled time
```

### Smoke Tests
1. **Homepage** — Loads in <2s, promotional banner visible (if active)
2. **Sign-in** — Login works, redirects to `/`
3. **Checkout** — Add to cart, proceed to shipping address, complete order
4. **Admin** — Access `/admin/overview`, verify metrics
5. **POS** — Access `/admin/pos`, search for product, can add to cart
6. **Promotions** — Admin can create/edit promotion, banner displays on homepage

---

## Database Migrations

### Applied in Sprint v2.1.0

**Migration 1: CartRecovery Table (Phase 6.7)**
- File: `prisma/migrations/20260528161307_create_cart_recovery_table/migration.sql`
- Adds: `CartRecovery` model with `cartId`, `email`, `token`, `sentAt`, `recoveredAt`

**Migration 2: Promotion Table (Phase 6.10)**
- File: `prisma/migrations/20260528162827_create_promotions_table/migration.sql`
- Adds: `Promotion` model with `title`, `subtitle`, `linkUrl`, `linkLabel`, `bgColor`, `textColor`, `isActive`, `startsAt`, `endsAt`

### Migration Commands

```bash
# View pending migrations
bun run prisma migrate status

# Apply all migrations to development
bun run prisma migrate deploy

# Create new migration (if schema changes)
bun run prisma migrate dev --name <migration_name>

# Reset database (dev only!)
bun run prisma migrate reset
```

---

## Troubleshooting

### E2E Tests Timeout
**Symptom:** `page.waitForURL: Timeout 30000ms exceeded`

**Cause:** Dev server not running or slow response

**Fix:**
1. Ensure `bun run dev` is running in another terminal
2. Check server logs for errors
3. Run single test: `bun run test:e2e -- --grep "specific test name"`

### Abandoned Cart Cron Not Triggering
**Symptom:** No emails sent, `CartRecovery.sentAt` is null

**Cause:** Cron job not configured or CRON_SECRET mismatch

**Fix:**
1. Verify `/api/cron/detect-abandoned-carts` endpoint is working
2. Check `CRON_SECRET` in `.env` vs Vercel environment
3. In Vercel, add CRON trigger in `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/detect-abandoned-carts",
       "schedule": "0 * * * *"
     }]
   }
   ```

### Promotional Banner Not Displaying
**Symptom:** Homepage loads but no banner visible

**Cause:** Promotion not active or timestamp mismatch

**Fix:**
1. Verify promotion in database: `SELECT * FROM "Promotion" WHERE "isActive" = true;`
2. Check current server time vs `startsAt` / `endsAt`
3. Try accessing `/admin/promotions` to see promotion status badges
4. Clear browser cache and reload homepage

---

## QA Sign-Off

**Testing Date:** _______________

**Tested By:** _______________

**Test Results:**
- [ ] All 18 E2E tests passing
- [ ] All integration tests passing
- [ ] All manual QA test cases passing
- [ ] Bundle size acceptable
- [ ] Cron jobs configured and tested
- [ ] Promotions create/display correctly
- [ ] Cart recovery flow working
- [ ] No critical bugs or regressions

**Sign-Off:** _______________

---

## Notes for Next Release

- Consider implementing E2E test data factories to avoid duplication
- Add performance benchmarking (Lighthouse CI integration)
- Document additional POS payment methods (MP, bank transfer)
- Consider adding load testing for homepage ISR invalidation at scale
