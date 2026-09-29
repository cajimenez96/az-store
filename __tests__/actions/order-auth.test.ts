/**
 * AZ-003 — Verifica que approveBankTransfer y rejectBankTransfer
 * usan requireAdminOrSeller() y bloquean correctamente por rol.
 */

// query-string v9+ es ESM-only — se mockea para evitar errores de parsing en Jest
jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    productVariant: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { approveBankTransfer, rejectBankTransfer } from '../../lib/actions/order.actions';

const mockAuth = auth as unknown as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;

function mockSession(role: string) {
  mockAuth.mockResolvedValue({
    user: { id: 'user-1', role, name: 'Test', email: 'test@test.com' },
    expires: '2099-12-31',
  });
}

function expectRedirectToUnauthorized() {
  expect(mockRedirect).toHaveBeenCalledWith('/unauthorized');
}

describe('AZ-003 · Autorización admin en Server Actions', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRedirect.mockClear();
  });

  describe('approveBankTransfer', () => {
    it('retorna error de autorización cuando role es "user"', async () => {
      mockSession('user');
      const result = await approveBankTransfer('order-1');
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/permisos/i);
    });

    it('retorna error de autorización cuando no hay sesión', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await approveBankTransfer('order-1');
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/permisos/i);
    });

    it('permite continuar cuando role es "admin"', async () => {
      mockSession('admin');
      const result = await approveBankTransfer('order-1');
      // No falla por auth (falla por orden no encontrada en db mock)
      expect(result.message).not.toMatch(/permisos/i);
    });

    it('permite continuar cuando role es "seller"', async () => {
      mockSession('seller');
      const result = await approveBankTransfer('order-1');
      expect(result.message).not.toMatch(/permisos/i);
    });
  });

  describe('rejectBankTransfer', () => {
    it('retorna error de autorización cuando role es "user"', async () => {
      mockSession('user');
      const result = await rejectBankTransfer('order-1');
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/permisos/i);
    });

    it('retorna error de autorización cuando no hay sesión', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await rejectBankTransfer('order-1');
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/permisos/i);
    });

    it('permite continuar cuando role es "admin"', async () => {
      mockSession('admin');
      const result = await rejectBankTransfer('order-1');
      expect(result.message).not.toMatch(/permisos/i);
    });

    it('permite continuar cuando role es "seller"', async () => {
      mockSession('seller');
      const result = await rejectBankTransfer('order-1');
      expect(result.message).not.toMatch(/permisos/i);
    });
  });
});
