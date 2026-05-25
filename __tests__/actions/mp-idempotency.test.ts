/**
 * AZ-006 — Idempotencia del webhook de Mercado Pago.
 * Verifica que el mismo pago no se procesa dos veces.
 */

jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));
jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/email', () => ({
  sendPurchaseReceipt: jest.fn(),
  sendNewSaleNotification: jest.fn(),
  sendShippingUpdate: jest.fn(),
}));
jest.mock('@/lib/mercadopago', () => ({ mpClient: {} }));
jest.mock('mercadopago', () => ({ Payment: jest.fn(), Preference: jest.fn() }));
jest.mock('@/lib/paypal', () => ({ paypal: { createOrder: jest.fn(), capturePayment: jest.fn() } }));
jest.mock('@/db/prisma', () => ({
  prisma: {
    order: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/db/prisma';
import { updateOrderToPaid } from '../../lib/actions/order.actions';

const mockFindFirst = prisma.order.findFirst as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ORDER_ID = 'order-idempotency-456';
const MP_PAYMENT_ID = 'mp-pay-99887766';

const baseOrder = {
  id: ORDER_ID,
  isPaid: false,
  paymentMethod: 'MercadoPago',
  orderitems: [{ productId: 'prod-1', size: 'M', qty: 1 }],
};

const updatedOrder = {
  ...baseOrder,
  isPaid: true,
  paidAt: new Date(),
  mpPaymentId: MP_PAYMENT_ID,
  shippingAddress: { street: 'Test 123' },
  paymentResult: { id: MP_PAYMENT_ID, status: 'approved' },
  user: { name: 'Test User', email: 'test@test.com' },
};

function buildMockTx() {
  return {
    productVariant: {
      findFirst: jest.fn().mockResolvedValue({ id: 'variant-1', stock: 5 }),
    },
    order: {
      update: jest.fn().mockResolvedValue(updatedOrder),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AZ-006 · Idempotencia de pagos MP en updateOrderToPaid', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('primer pago (mpPaymentId nuevo)', () => {
    it('procesa el pago y almacena mpPaymentId cuando es la primera vez', async () => {
      mockFindFirst
        .mockResolvedValueOnce(null)        // idempotency check → no existe
        .mockResolvedValueOnce(baseOrder)   // order lookup
        .mockResolvedValueOnce(updatedOrder); // post-tx lookup

      const mockTx = buildMockTx();
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await updateOrderToPaid({ orderId: ORDER_ID, mpPaymentId: MP_PAYMENT_ID });

      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORDER_ID },
          data: expect.objectContaining({ isPaid: true, mpPaymentId: MP_PAYMENT_ID }),
        })
      );
    });
  });

  describe('pago duplicado (mismo mpPaymentId ya registrado)', () => {
    it('lanza error cuando el mpPaymentId ya está registrado en otra orden', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'another-order',
        mpPaymentId: MP_PAYMENT_ID,
      }); // idempotency check → encontrado

      const mockTx = buildMockTx();
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await expect(
        updateOrderToPaid({ orderId: ORDER_ID, mpPaymentId: MP_PAYMENT_ID })
      ).rejects.toThrow(/La orden ya está pagada/);

      // No debe iniciar la transacción ni actualizar la orden
      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockTx.order.update).not.toHaveBeenCalled();
    });

    it('lanza error cuando la misma orden ya está pagada (isPaid check)', async () => {
      const paidOrder = { ...baseOrder, isPaid: true };

      mockFindFirst
        .mockResolvedValueOnce(null)       // idempotency check → no existe
        .mockResolvedValueOnce(paidOrder); // order lookup → ya pagada

      const mockTx = buildMockTx();
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await expect(
        updateOrderToPaid({ orderId: ORDER_ID, mpPaymentId: 'mp-pay-nuevo' })
      ).rejects.toThrow(/La orden ya está pagada/);

      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('sin mpPaymentId (PayPal, COD)', () => {
    it('omite la verificación de idempotencia cuando no se pasa mpPaymentId', async () => {
      mockFindFirst
        .mockResolvedValueOnce(baseOrder)   // order lookup (primer findFirst)
        .mockResolvedValueOnce(updatedOrder); // post-tx lookup

      const mockTx = buildMockTx();
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await updateOrderToPaid({ orderId: ORDER_ID });

      // findFirst solo se llama dos veces (order lookup + post-tx), no tres
      expect(mockFindFirst).toHaveBeenCalledTimes(2);
      expect(mockTx.order.update).toHaveBeenCalledTimes(1);
    });

    it('no incluye mpPaymentId en el update cuando no se pasa', async () => {
      mockFindFirst
        .mockResolvedValueOnce(baseOrder)
        .mockResolvedValueOnce(updatedOrder);

      const mockTx = buildMockTx();
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await updateOrderToPaid({ orderId: ORDER_ID });

      const updateCall = mockTx.order.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('mpPaymentId');
    });
  });
});
