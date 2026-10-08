import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));
jest.mock('@/lib/mercadopago', () => ({
  mpClient: {},
  getMercadoPagoClient: jest.fn().mockResolvedValue({}),
}));
jest.mock('mercadopago', () => ({
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
  })),
}));
jest.mock('@/lib/actions/order.actions', () => ({
  updateOrderToPaid: jest.fn(),
}));
jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { POST } from '../../app/api/webhooks/mercadopago/route';
import { prisma } from '@/db/prisma';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { Payment } from 'mercadopago';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECRET = 'test-webhook-secret-az';
const REQUEST_ID = 'req-abc-123';
const DATA_ID = '99887766';
const TS = '1716000000';

function buildSignature(dataId = DATA_ID, ts = TS, secret = SECRET): string {
  const message = `id:${dataId};request-id:${REQUEST_ID};ts:${ts}`;
  const hmac = createHmac('sha256', secret).update(message).digest('hex');
  return `ts=${ts},v1=${hmac}`;
}

function makeWebhookRequest(
  overrides: {
    body?: object;
    headers?: Record<string, string>;
    searchParams?: string;
  } = {}
): NextRequest {
  const url = `http://localhost/api/webhooks/mercadopago${overrides.searchParams ?? ''}`;
  const body = overrides.body ?? { type: 'payment', data: { id: DATA_ID } };
  return new NextRequest(url, {
    method: 'POST',
    headers: overrides.headers ?? {},
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AZ-004 · POST /api/webhooks/mercadopago — verificación de firma', () => {
  beforeEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    jest.clearAllMocks();
  });

  describe('MERCADOPAGO_WEBHOOK_SECRET no configurado', () => {
    it('retorna 500 cuando la variable de entorno no está definida', async () => {
      delete process.env.MERCADOPAGO_WEBHOOK_SECRET;

      const res = await POST(makeWebhookRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toMatch(/MERCADOPAGO_WEBHOOK_SECRET/);
    });
  });

  describe('Headers de firma ausentes', () => {
    it('retorna 401 cuando no se envía x-signature', async () => {
      const res = await POST(
        makeWebhookRequest({ headers: { 'x-request-id': REQUEST_ID } })
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('retorna 401 cuando no se envía x-request-id', async () => {
      const res = await POST(
        makeWebhookRequest({ headers: { 'x-signature': buildSignature() } })
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe('Firma inválida', () => {
    it('retorna 401 cuando el HMAC no coincide', async () => {
      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': `ts=${TS},v1=aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899`,
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toMatch(/inválida/);
    });

    it('retorna 401 cuando la firma se calculó con un secret distinto', async () => {
      const fakeSignature = buildSignature(DATA_ID, TS, 'otro-secret-incorrecto');

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': fakeSignature,
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe('Firma válida', () => {
    it('procesa la notificación cuando la firma es correcta (formato webhook)', async () => {
      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );

      // El mock de Payment.get() retorna undefined → "Payment status is not approved"
      // Lo importante: no retorna 401 ni 500 por firma
      expect(res.status).toBe(200);
    });

    it('procesa notificación IPN via query params con firma válida', async () => {
      const ipnSignature = buildSignature(DATA_ID, TS);

      const res = await POST(
        makeWebhookRequest({
          body: {},
          searchParams: `?id=${DATA_ID}&topic=payment`,
          headers: {
            'x-signature': ipnSignature,
            'x-request-id': REQUEST_ID,
          },
        })
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Reconciliación de Pago y Orden', () => {
    const mockOrder = {
      id: 'order-123',
      totalPrice: '10000.00',
      paymentMethod: 'MercadoPago',
      isPaid: false,
      shippingStatus: 'Pendiente',
    };

    beforeEach(() => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({});
      (updateOrderToPaid as jest.Mock).mockResolvedValue({ success: true });
    });

    it('retorna 404 si la orden no existe en base de datos', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);
      (Payment as unknown as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          status: 'approved',
          external_reference: 'order-inexistente',
          transaction_amount: 10000,
          currency_id: 'ARS',
          payer: { email: 'buyer@test.com' },
        }),
      }));

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(updateOrderToPaid).not.toHaveBeenCalled();
    });

    it('retorna 200 y no vuelve a procesar si la orden ya estaba pagada', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        isPaid: true,
      });
      (Payment as unknown as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          status: 'approved',
          external_reference: 'order-123',
          transaction_amount: 10000,
          currency_id: 'ARS',
          payer: { email: 'buyer@test.com' },
        }),
      }));

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toMatch(/already paid/i);
      expect(updateOrderToPaid).not.toHaveBeenCalled();
    });

    it('no marca pagada y retorna 200 cuando el monto es menor al total', async () => {
      (Payment as unknown as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          status: 'approved',
          external_reference: 'order-123',
          transaction_amount: 5000, // Menor a 10000
          currency_id: 'ARS',
          payer: { email: 'buyer@test.com' },
        }),
      }));

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updateOrderToPaid).not.toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-123' },
          data: expect.objectContaining({
            paymentResult: expect.objectContaining({
              status: 'DISCREPANCY_AMOUNT',
            }),
          }),
        })
      );
    });

    it('no marca pagada y retorna 200 cuando la moneda es distinta a ARS', async () => {
      (Payment as unknown as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          status: 'approved',
          external_reference: 'order-123',
          transaction_amount: 10000,
          currency_id: 'USD', // Moneda no admitida
          payer: { email: 'buyer@test.com' },
        }),
      }));

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updateOrderToPaid).not.toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-123' },
          data: expect.objectContaining({
            paymentResult: expect.objectContaining({
              status: 'DISCREPANCY_CURRENCY',
            }),
          }),
        })
      );
    });

    it('no marca pagada y retorna 200 cuando el método de pago no es Mercado Pago', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        paymentMethod: 'TransferenciaBancaria',
      });
      (Payment as unknown as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          status: 'approved',
          external_reference: 'order-123',
          transaction_amount: 10000,
          currency_id: 'ARS',
          payer: { email: 'buyer@test.com' },
        }),
      }));

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updateOrderToPaid).not.toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-123' },
          data: expect.objectContaining({
            paymentResult: expect.objectContaining({
              status: 'DISCREPANCY_PAYMENT_METHOD',
            }),
          }),
        })
      );
    });

    it('no marca pagada y retorna 200 cuando la orden está cancelada', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        shippingStatus: 'Cancelado',
      });
      (Payment as unknown as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          status: 'approved',
          external_reference: 'order-123',
          transaction_amount: 10000,
          currency_id: 'ARS',
          payer: { email: 'buyer@test.com' },
        }),
      }));

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updateOrderToPaid).not.toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-123' },
          data: expect.objectContaining({
            paymentResult: expect.objectContaining({
              status: 'DISCREPANCY_ORDER_CANCELLED',
            }),
          }),
        })
      );
    });

    it('caso feliz: aprueba el pago, llama a updateOrderToPaid y retorna 200', async () => {
      (Payment as unknown as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          status: 'approved',
          external_reference: 'order-123',
          transaction_amount: 10000,
          currency_id: 'ARS',
          payer: { email: 'buyer@test.com' },
        }),
      }));

      const res = await POST(
        makeWebhookRequest({
          headers: {
            'x-signature': buildSignature(),
            'x-request-id': REQUEST_ID,
          },
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updateOrderToPaid).toHaveBeenCalledWith({
        orderId: 'order-123',
        paymentResult: {
          id: String(DATA_ID),
          status: 'approved',
          email_address: 'buyer@test.com',
          pricePaid: '10000',
        },
        mpPaymentId: String(DATA_ID),
      });
    });
  });
});
