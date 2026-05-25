import { NextRequest } from 'next/server';

jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
    },
  },
}));

import { POST } from '../../app/api/cron/release-expired-orders/route';
import { prisma } from '@/db/prisma';

const mockFindMany = prisma.order.findMany as jest.Mock;

function makeRequest(headers: Record<string, string> = {}, secret?: string) {
  const url = secret
    ? `http://localhost/api/cron/release-expired-orders?secret=${secret}`
    : 'http://localhost/api/cron/release-expired-orders';

  return new NextRequest(url, { method: 'POST', headers });
}

describe('AZ-002 · POST /api/cron/release-expired-orders', () => {
  const VALID_SECRET = 'test-cron-secret-123';

  beforeEach(() => {
    mockFindMany.mockResolvedValue([]);
  });

  describe('CRON_SECRET no configurado', () => {
    it('retorna 500 cuando CRON_SECRET no está definido en el entorno', async () => {
      delete process.env.CRON_SECRET;

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toMatch(/CRON_SECRET/);
    });
  });

  describe('CRON_SECRET configurado', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = VALID_SECRET;
    });

    afterEach(() => {
      delete process.env.CRON_SECRET;
    });

    it('retorna 401 cuando no se envía ningún secret', async () => {
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('retorna 401 cuando el secret del header es incorrecto', async () => {
      const res = await POST(makeRequest({ Authorization: 'Bearer wrong-secret' }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('retorna 401 cuando el secret del query param es incorrecto', async () => {
      const res = await POST(makeRequest({}, 'wrong-secret'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('retorna 200 con Authorization header correcto', async () => {
      const res = await POST(makeRequest({ Authorization: `Bearer ${VALID_SECRET}` }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('retorna 200 con secret en query param correcto', async () => {
      const res = await POST(makeRequest({}, VALID_SECRET));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
