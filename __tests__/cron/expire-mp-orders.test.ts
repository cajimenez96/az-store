/**
 * AZ-2.2 — Expiración de órdenes MP huérfanas.
 * Verifica que el cron cancela órdenes MP sin restaurar stock,
 * y que sigue restaurando stock para órdenes de TransferenciaBancaria.
 */

jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));
jest.mock('@/lib/mercadopago', () => ({ mpClient: {} }));
jest.mock('mercadopago', () => ({ Payment: jest.fn(), Preference: jest.fn() }));
jest.mock('@/db/prisma', () => ({
  prisma: {
    order: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { POST } from '../../app/api/cron/release-expired-orders/route';
import { prisma } from '@/db/prisma';

const mockFindMany = prisma.order.findMany as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

const VALID_SECRET = 'test-cron-secret';

function makeRequest() {
  return new NextRequest(
    `http://localhost/api/cron/release-expired-orders?secret=${VALID_SECRET}`,
    { method: 'POST' }
  );
}

function buildTx() {
  return {
    productVariant: {
      findFirst: jest.fn().mockResolvedValue({ id: 'variant-1', stock: 5 }),
      update: jest.fn().mockResolvedValue({}),
    },
    order: {
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('AZ-2.2 · Expiración de órdenes MP huérfanas', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.CRON_SECRET = VALID_SECRET;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  describe('orden MP expirada', () => {
    it('cancela la orden sin restaurar stock', async () => {
      const mpOrder = {
        id: 'order-mp-1',
        paymentMethod: 'MercadoPago',
        paymentResult: null,
        orderitems: [{ productId: 'prod-1', size: 'M', qty: 2 }],
      };

      mockFindMany.mockResolvedValueOnce([mpOrder]);

      const mockTx = buildTx();
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // No stock restoration for MP orders
      expect(mockTx.productVariant.findFirst).not.toHaveBeenCalled();
      expect(mockTx.productVariant.update).not.toHaveBeenCalled();

      // Order marked as CANCELLED
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-mp-1' },
          data: expect.objectContaining({
            paymentResult: expect.objectContaining({ status: 'CANCELLED' }),
          }),
        })
      );
    });

    it('el motivo de cancelación indica pago no completado', async () => {
      mockFindMany.mockResolvedValueOnce([
        { id: 'order-mp-2', paymentMethod: 'MercadoPago', paymentResult: null, orderitems: [] },
      ]);

      let capturedData: Record<string, unknown> = {};
      const mockTx = {
        productVariant: { findFirst: jest.fn(), update: jest.fn() },
        order: {
          update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
            capturedData = data;
            return Promise.resolve({});
          }),
        },
      };
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      await POST(makeRequest());

      const paymentResult = capturedData.paymentResult as { reason: string };
      expect(paymentResult.reason).toMatch(/pago no completado/);
    });
  });

  describe('orden TransferenciaBancaria expirada', () => {
    it('restaura stock y cancela la orden', async () => {
      const tbOrder = {
        id: 'order-tb-1',
        paymentMethod: 'TransferenciaBancaria',
        paymentResult: null,
        orderitems: [{ productId: 'prod-1', size: 'M', qty: 1 }],
      };

      mockFindMany.mockResolvedValueOnce([tbOrder]);

      const mockTx = buildTx();
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      await POST(makeRequest());

      // Stock restoration happens for bank transfer
      expect(mockTx.productVariant.findFirst).toHaveBeenCalledTimes(1);
      expect(mockTx.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { stock: { increment: 1 } } })
      );
      expect(mockTx.order.update).toHaveBeenCalledTimes(1);
    });

    it('el motivo de cancelación indica falta de comprobante', async () => {
      mockFindMany.mockResolvedValueOnce([
        {
          id: 'order-tb-2',
          paymentMethod: 'TransferenciaBancaria',
          paymentResult: null,
          orderitems: [],
        },
      ]);

      let capturedData: Record<string, unknown> = {};
      const mockTx = {
        productVariant: { findFirst: jest.fn(), update: jest.fn() },
        order: {
          update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
            capturedData = data;
            return Promise.resolve({});
          }),
        },
      };
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      await POST(makeRequest());

      const paymentResult = capturedData.paymentResult as { reason: string };
      expect(paymentResult.reason).toMatch(/comprobante/);
    });
  });

  describe('mix de órdenes MP y TB', () => {
    it('restaura stock solo para TB, cancela ambas', async () => {
      const orders = [
        {
          id: 'order-mp-3',
          paymentMethod: 'MercadoPago',
          paymentResult: null,
          orderitems: [{ productId: 'prod-1', size: 'M', qty: 1 }],
        },
        {
          id: 'order-tb-3',
          paymentMethod: 'TransferenciaBancaria',
          paymentResult: null,
          orderitems: [{ productId: 'prod-2', size: 'L', qty: 2 }],
        },
      ];

      mockFindMany.mockResolvedValueOnce(orders);

      const variantFindCalls: string[] = [];
      const orderUpdateIds: string[] = [];

      mockTransaction.mockImplementation(
        async (cb: (tx: ReturnType<typeof buildTx>) => Promise<void>) => {
          const tx = {
            productVariant: {
              findFirst: jest.fn().mockImplementation(() => {
                variantFindCalls.push('findFirst');
                return Promise.resolve({ id: 'v1', stock: 5 });
              }),
              update: jest.fn().mockResolvedValue({}),
            },
            order: {
              update: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
                orderUpdateIds.push(where.id);
                return Promise.resolve({});
              }),
            },
          };
          await cb(tx);
        }
      );

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(body.success).toBe(true);
      // variant lookup only for TB order
      expect(variantFindCalls).toHaveLength(1);
      // both orders cancelled
      expect(orderUpdateIds).toHaveLength(2);
      expect(orderUpdateIds).toContain('order-mp-3');
      expect(orderUpdateIds).toContain('order-tb-3');
    });
  });

  describe('filtro de órdenes ya canceladas', () => {
    it('no reprocesa órdenes que ya tienen status CANCELLED', async () => {
      mockFindMany.mockResolvedValueOnce([
        {
          id: 'order-already-cancelled',
          paymentMethod: 'MercadoPago',
          paymentResult: { status: 'CANCELLED' },
          orderitems: [],
        },
      ]);

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toMatch(/No hay órdenes expiradas/);
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('sin órdenes expiradas', () => {
    it('retorna mensaje indicando que no hay órdenes para procesar', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toMatch(/No hay órdenes expiradas/);
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });
});
