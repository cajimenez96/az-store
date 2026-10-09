jest.mock('@/db/prisma', () => ({
  prisma: { order: { findFirst: jest.fn() } },
}));

import { prisma } from '@/db/prisma';
import { authorizeImageUpload, authorizeReceiptUpload } from '@/lib/uploadthing-guards';

const findFirst = prisma.order.findFirst as jest.Mock;

const session = (role: string, id = 'user-1') => ({ user: { id, role } }) as any;
const ORDER_ID = '11111111-1111-4111-8111-111111111111';

const order = (overrides: Record<string, unknown> = {}) => ({
  id: ORDER_ID,
  userId: 'user-1',
  paymentMethod: 'TransferenciaBancaria',
  isPaid: false,
  paymentResult: null,
  ...overrides,
});

describe('authorizeImageUpload', () => {
  it('denies anonymous callers', () => {
    expect(() => authorizeImageUpload(null)).toThrow('No autorizado');
  });
  it('denies customers', () => {
    expect(() => authorizeImageUpload(session('user'))).toThrow('No autorizado');
  });
  it('allows sellers and admins', () => {
    expect(authorizeImageUpload(session('seller', 's1'))).toEqual({ userId: 's1' });
    expect(authorizeImageUpload(session('admin', 'a1'))).toEqual({ userId: 'a1' });
  });
});

describe('authorizeReceiptUpload', () => {
  beforeEach(() => findFirst.mockReset());

  it('denies anonymous callers without touching the DB', async () => {
    await expect(authorizeReceiptUpload(null, ORDER_ID)).rejects.toThrow('No autorizado');
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('denies a missing order', async () => {
    findFirst.mockResolvedValue(null);
    await expect(authorizeReceiptUpload(session('user'), ORDER_ID)).rejects.toThrow('Orden no encontrada');
  });

  it("denies someone else's order", async () => {
    findFirst.mockResolvedValue(order({ userId: 'other' }));
    await expect(authorizeReceiptUpload(session('user'), ORDER_ID)).rejects.toThrow('No autorizado');
  });

  it('denies an order that is not a bank transfer', async () => {
    findFirst.mockResolvedValue(order({ paymentMethod: 'MercadoPago' }));
    await expect(authorizeReceiptUpload(session('user'), ORDER_ID)).rejects.toThrow(
      'transferencia bancaria'
    );
  });

  it('denies a paid order', async () => {
    findFirst.mockResolvedValue(order({ isPaid: true }));
    await expect(authorizeReceiptUpload(session('user'), ORDER_ID)).rejects.toThrow(
      'La orden ya fue pagada'
    );
  });

  it('denies a cancelled order', async () => {
    findFirst.mockResolvedValue(order({ paymentResult: { status: 'CANCELLED' } }));
    await expect(authorizeReceiptUpload(session('user'), ORDER_ID)).rejects.toThrow(
      'La orden fue cancelada'
    );
  });

  it('allows the owner', async () => {
    findFirst.mockResolvedValue(order());
    await expect(authorizeReceiptUpload(session('user'), ORDER_ID)).resolves.toEqual({
      userId: 'user-1',
      orderId: ORDER_ID,
    });
  });

  it.each(['admin', 'seller'])('allows %s on any order', async (role) => {
    findFirst.mockResolvedValue(order({ userId: 'other' }));
    await expect(authorizeReceiptUpload(session(role, 'staff-1'), ORDER_ID)).resolves.toEqual({
      userId: 'staff-1',
      orderId: ORDER_ID,
    });
  });
});
