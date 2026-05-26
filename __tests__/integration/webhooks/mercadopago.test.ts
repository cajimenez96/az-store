import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/db/prisma';
import { POST } from '@/app/api/webhooks/mercadopago/route';
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

jest.mock('@/lib/mercadopago', () => ({ mpClient: {} }));

const mockPaymentGet = jest.fn();
jest.mock('mercadopago', () => ({
  Payment: jest.fn().mockImplementation(() => ({ get: mockPaymentGet })),
}));

const TEST_SECRET = 'integration-test-webhook-secret-3.1';
const REQUEST_ID = 'req-integration-3-1';
const TS = '1716000000';

function buildSignature(dataId: string, secret = TEST_SECRET): string {
  const message = `id:${dataId};request-id:${REQUEST_ID};ts:${TS}`;
  const hmac = createHmac('sha256', secret).update(message).digest('hex');
  return `ts=${TS},v1=${hmac}`;
}

function makeRequest(paymentId: string, headerOverrides: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/mercadopago', {
    method: 'POST',
    headers: {
      'x-signature': buildSignature(paymentId),
      'x-request-id': REQUEST_ID,
      ...headerOverrides,
    },
    body: JSON.stringify({ type: 'payment', data: { id: paymentId } }),
  });
}

describe('3.1 · Webhook MP — integration', () => {
  let userId: string;
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    const variant = await createTestVariant(product.id, size.id, 20);

    userId = user.id;
    productId = product.id;
    variantId = variant.id;
  });

  beforeEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = TEST_SECRET;
    mockPaymentGet.mockReset();
  });

  afterEach(() => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('marks order as paid and decrements stock on approved payment', async () => {
    const MP_ID = 'mp-int-3-1-approved-001';
    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 2 });

    mockPaymentGet.mockResolvedValueOnce({
      status: 'approved',
      external_reference: order.id,
      payer: { email: 'buyer@test.com' },
      transaction_amount: 100,
    });

    const res = await POST(makeRequest(MP_ID));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.isPaid).toBe(true);
    expect(updatedOrder?.mpPaymentId).toBe(MP_ID);
    expect(updatedOrder?.paidAt).not.toBeNull();

    const updatedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(updatedVariant?.stock).toBe(stockBefore - 2);
  });

  it('returns 401 and leaves DB unchanged when signature is invalid', async () => {
    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const res = await POST(
      makeRequest('mp-int-3-1-badsig', {
        'x-signature': `ts=${TS},v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef`,
      })
    );

    expect(res.status).toBe(401);

    const unchangedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(unchangedOrder?.isPaid).toBe(false);

    const unchangedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(unchangedVariant?.stock).toBe(stockBefore);
  });

  it('is idempotent: duplicate paymentId returns 200 without modifying DB again', async () => {
    const MP_ID = 'mp-int-3-1-idem-001';
    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    mockPaymentGet.mockResolvedValue({
      status: 'approved',
      external_reference: order.id,
      payer: { email: 'buyer@test.com' },
      transaction_amount: 50,
    });

    const res1 = await POST(makeRequest(MP_ID));
    expect(res1.status).toBe(200);

    const stockAfterFirst = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    // Second call — same paymentId, same order — must succeed silently
    const res2 = await POST(makeRequest(MP_ID));
    expect(res2.status).toBe(200);

    // Stock must NOT be decremented a second time
    const stockAfterSecond = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfterSecond).toBe(stockAfterFirst);
  });

  it('does not mark order as paid when payment status is not approved', async () => {
    const MP_ID = 'mp-int-3-1-pending-001';
    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    mockPaymentGet.mockResolvedValueOnce({
      status: 'pending',
      external_reference: order.id,
    });

    const res = await POST(makeRequest(MP_ID));
    expect(res.status).toBe(200);

    const unchangedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(unchangedOrder?.isPaid).toBe(false);
  });

  it('returns 500 when MERCADOPAGO_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;

    const res = await POST(makeRequest('mp-int-3-1-nosecret'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toMatch(/MERCADOPAGO_WEBHOOK_SECRET/);
  });
});
