import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));
jest.mock('@/lib/mercadopago', () => ({ mpClient: {} }));
jest.mock('mercadopago', () => ({
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
  })),
}));
jest.mock('@/lib/actions/order.actions', () => ({
  updateOrderToPaid: jest.fn(),
}));

import { POST } from '../../app/api/webhooks/mercadopago/route';

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
});
