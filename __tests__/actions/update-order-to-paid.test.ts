/**
 * AZ-005 — Guard atómico de stock en updateOrderToPaid.
 * Verifica que el stock nunca queda negativo en compras simultáneas.
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

const ORDER_ID = 'order-test-123';

const baseOrder = {
  id: ORDER_ID,
  isPaid: false,
  paymentMethod: 'MercadoPago',
  orderitems: [
    { productId: 'prod-1', size: 'M', qty: 1 },
  ],
};

const updatedOrder = {
  ...baseOrder,
  isPaid: true,
  paidAt: new Date(),
  shippingAddress: { street: 'Test 123' },
  paymentResult: { id: 'pay-1', status: 'approved' },
  user: { name: 'Test User', email: 'test@test.com' },
};

function buildMockTx(executeRawReturn: number) {
  return {
    productVariant: {
      findFirst: jest.fn().mockResolvedValue({ id: 'variant-1', stock: 1 }),
    },
    order: {
      update: jest.fn().mockResolvedValue(updatedOrder),
    },
    $executeRaw: jest.fn().mockResolvedValue(executeRawReturn),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AZ-005 · Guard atómico de stock en updateOrderToPaid', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // Primera llamada: orden antes de la transacción
    // Segunda llamada: orden actualizada para el email
    mockFindFirst
      .mockResolvedValueOnce(baseOrder)
      .mockResolvedValueOnce(updatedOrder);
  });

  describe('stock suficiente', () => {
    it('decrementa el stock y marca la orden como pagada cuando hay unidades disponibles', async () => {
      const mockTx = buildMockTx(1); // 1 fila afectada → stock ok
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await updateOrderToPaid({ orderId: ORDER_ID });

      expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORDER_ID }, data: expect.objectContaining({ isPaid: true }) })
      );
    });
  });

  describe('stock insuficiente (race condition)', () => {
    it('lanza error y hace rollback cuando el stock llega a 0 antes del decremento', async () => {
      const mockTx = buildMockTx(0); // 0 filas afectadas → stock insuficiente
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await expect(updateOrderToPaid({ orderId: ORDER_ID })).rejects.toThrow(
        /Stock insuficiente/
      );

      // La orden NO debe marcarse como pagada
      expect(mockTx.order.update).not.toHaveBeenCalled();
    });
  });

  describe('variante no encontrada', () => {
    it('lanza error cuando la variante del producto no existe en la DB', async () => {
      const mockTx = {
        productVariant: { findFirst: jest.fn().mockResolvedValue(null) },
        order: { update: jest.fn() },
        $executeRaw: jest.fn(),
      };
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await expect(updateOrderToPaid({ orderId: ORDER_ID })).rejects.toThrow(
        /Variante no encontrada/
      );

      expect(mockTx.$executeRaw).not.toHaveBeenCalled();
      expect(mockTx.order.update).not.toHaveBeenCalled();
    });
  });

  describe('transferencia bancaria', () => {
    it('no decrementa stock para órdenes de transferencia bancaria (ya fue decrementado al crear)', async () => {
      const bankOrder = { ...baseOrder, paymentMethod: 'TransferenciaBancaria' };
      mockFindFirst
        .mockReset()
        .mockResolvedValueOnce(bankOrder)
        .mockResolvedValueOnce({ ...updatedOrder, paymentMethod: 'TransferenciaBancaria' });

      const mockTx = buildMockTx(1);
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx)
      );

      await updateOrderToPaid({ orderId: ORDER_ID });

      expect(mockTx.$executeRaw).not.toHaveBeenCalled();
      expect(mockTx.order.update).toHaveBeenCalledTimes(1);
    });
  });
});
