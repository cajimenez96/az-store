import { NextRequest } from 'next/server';
import { prisma } from '@/db/prisma';
import { POST } from '@/app/api/cron/release-expired-orders/route';
import {
  createTestUser,
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
  createTestOrder,
  createTestOrderItem,
} from '../../factories';

const TEST_SECRET = 'cron-integration-test-secret-3.4';
const PAST = new Date(Date.now() - 60_000);    // 1 minute ago
const FUTURE = new Date(Date.now() + 3_600_000); // 1 hour from now

function makeCronRequest(secret = TEST_SECRET): NextRequest {
  return new NextRequest(
    `http://localhost/api/cron/release-expired-orders?secret=${secret}`,
    { method: 'POST' }
  );
}

describe('3.4 · Cron release-expired-orders — integration', () => {
  let userId: string;
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    const variant = await createTestVariant(product.id, size.id, 30);

    userId = user.id;
    productId = product.id;
    variantId = variant.id;
  });

  beforeEach(() => {
    process.env.CRON_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cancels expired TB order and restores reserved stock', async () => {
    const qty = 3;
    const order = await createTestOrder(userId, {
      paymentMethod: 'TransferenciaBancaria',
      expiresAt: PAST,
    });
    await createTestOrderItem(order.id, productId, { size: 'M', qty });
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { decrement: qty } },
    });

    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const res = await POST(makeCronRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const cancelledOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const paymentResult = cancelledOrder?.paymentResult as { status?: string } | null;
    expect(paymentResult?.status).toBe('CANCELLED');

    const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfter).toBe(stockBefore + qty);
  });

  it('cancels expired MP order without touching stock', async () => {
    const stockSnapshot = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const order = await createTestOrder(userId, {
      paymentMethod: 'MercadoPago',
      expiresAt: PAST,
    });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 2 });

    const res = await POST(makeCronRequest());
    expect(res.status).toBe(200);

    const cancelledOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const paymentResult = cancelledOrder?.paymentResult as { status?: string } | null;
    expect(paymentResult?.status).toBe('CANCELLED');

    // MP never reserved stock, so it must remain unchanged
    const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfter).toBe(stockSnapshot);
  });

  it('does not cancel orders with expiresAt in the future', async () => {
    const order = await createTestOrder(userId, {
      paymentMethod: 'TransferenciaBancaria',
      expiresAt: FUTURE,
    });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const res = await POST(makeCronRequest());
    expect(res.status).toBe(200);

    const activeOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const paymentResult = activeOrder?.paymentResult as { status?: string } | null;
    expect(paymentResult?.status).not.toBe('CANCELLED');

    const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfter).toBe(stockBefore);
  });

  it('does not touch already paid orders even if expiresAt is in the past', async () => {
    const order = await createTestOrder(userId, {
      paymentMethod: 'MercadoPago',
      expiresAt: PAST,
      isPaid: true,
      paidAt: new Date(),
    });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    const res = await POST(makeCronRequest());
    expect(res.status).toBe(200);

    const unchangedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(unchangedOrder?.isPaid).toBe(true);
  });

  it('is idempotent: re-running on already-cancelled orders changes nothing', async () => {
    const order = await createTestOrder(userId, {
      paymentMethod: 'TransferenciaBancaria',
      expiresAt: PAST,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentResult: { status: 'CANCELLED', reason: 'pre-cancelled', cancelledAt: new Date().toISOString() } },
    });

    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    await POST(makeCronRequest());

    const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfter).toBe(stockBefore);
  });

  it('returns 401 when secret is invalid', async () => {
    const res = await POST(makeCronRequest('wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;

    const res = await POST(makeCronRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toMatch(/CRON_SECRET/);
  });
});
