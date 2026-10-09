/**
 * AZ-005 — updateOrderReceipt only accepts receipts registered for the caller
 * and the order, and receipt deletions go through the registry-checked helper.
 */

jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));
jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/email', () => ({
  sendPurchaseReceipt: jest.fn(),
  sendNewSaleNotification: jest.fn(),
  sendShippingUpdate: jest.fn(),
  sendTransferApproved: jest.fn(),
  sendTransferRejected: jest.fn(),
}));
jest.mock('@/lib/mercadopago', () => ({ mpClient: {} }));
jest.mock('mercadopago', () => ({ Payment: jest.fn(), Preference: jest.fn() }));
jest.mock('@/lib/paypal', () => ({ paypal: { createOrder: jest.fn(), capturePayment: jest.fn() } }));
jest.mock('@/lib/uploadthing-helpers', () => ({
  deleteUTFiles: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/uploads/registry', () => ({
  ...jest.requireActual('@/lib/uploads/registry'),
  findRegisteredReceipt: jest.fn(),
  deleteRegisteredReceiptFile: jest.fn().mockResolvedValue({ deleted: true }),
}));
jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    productVariant: { findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { deleteUTFiles } from '@/lib/uploadthing-helpers';
import { deleteRegisteredReceiptFile, findRegisteredReceipt } from '@/lib/uploads/registry';
import { rejectBankTransfer, updateOrderReceipt } from '../../lib/actions/order.actions';

const mockAuth = auth as unknown as jest.Mock;
const mockFindFirst = prisma.order.findFirst as jest.Mock;
const mockUpdate = prisma.order.update as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindRegistered = findRegisteredReceipt as jest.Mock;
const mockDeleteRegistered = deleteRegisteredReceiptFile as jest.Mock;
const mockDeleteUT = deleteUTFiles as jest.Mock;

const ORDER_ID = 'order-1';
const OWNER_ID = 'user-1';
const NEW_URL = 'https://utfs.io/f/new-receipt.jpg';
const OLD_URL = 'https://utfs.io/f/old-receipt.jpg';

function mockSession(id: string, role = 'user') {
  mockAuth.mockResolvedValue({
    user: { id, role, name: 'Test', email: 'test@test.com' },
    expires: '2099-12-31',
  });
}

function baseOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    userId: OWNER_ID,
    paymentMethod: 'TransferenciaBancaria',
    isPaid: false,
    paymentResult: null,
    receiptUrl: null,
    orderitems: [],
    ...overrides,
  };
}

describe('AZ-005 · updateOrderReceipt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteRegistered.mockResolvedValue({ deleted: true });
    mockUpdate.mockResolvedValue({});
    mockFindRegistered.mockResolvedValue({ key: 'new-receipt.jpg' });
    mockSession(OWNER_ID);
    mockFindFirst.mockResolvedValue(baseOrder());
  });

  it('rejects anonymous callers', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);
    expect(result.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects another customer's order with 'No autorizado'", async () => {
    mockSession('intruder');
    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);
    expect(result).toMatchObject({ success: false, message: 'No autorizado' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it.each(['admin', 'seller'])('allows %s on any order', async (role) => {
    mockSession('staff-1', role);
    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);
    expect(result.success).toBe(true);
    expect(mockFindRegistered).toHaveBeenCalledWith({
      key: 'new-receipt.jpg',
      userId: 'staff-1',
      orderId: ORDER_ID,
    });
  });

  it('rejects orders that are not bank transfers', async () => {
    mockFindFirst.mockResolvedValue(baseOrder({ paymentMethod: 'MercadoPago' }));
    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);
    expect(result).toMatchObject({
      success: false,
      message: 'El método de pago no es transferencia bancaria',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects paid orders', async () => {
    mockFindFirst.mockResolvedValue(baseOrder({ isPaid: true }));
    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);
    expect(result).toMatchObject({ success: false, message: 'La orden ya fue pagada' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects cancelled orders', async () => {
    mockFindFirst.mockResolvedValue(baseOrder({ paymentResult: { status: 'CANCELLED' } }));
    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);
    expect(result).toMatchObject({ success: false, message: 'La orden fue cancelada' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects external URLs', async () => {
    const result = await updateOrderReceipt(ORDER_ID, 'https://evil.com/f/KEY');
    expect(result).toMatchObject({ success: false, message: 'Comprobante inválido' });
    expect(mockFindRegistered).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects a valid-host URL whose key is not registered for this user and order', async () => {
    mockFindRegistered.mockResolvedValue(null);
    mockFindFirst.mockResolvedValue(baseOrder({ receiptUrl: OLD_URL }));

    const result = await updateOrderReceipt(ORDER_ID, 'https://utfs.io/f/product-image.jpg');

    expect(result).toMatchObject({
      success: false,
      message: 'El comprobante no corresponde a una subida tuya para esta orden',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockDeleteRegistered).not.toHaveBeenCalled();
    expect(mockDeleteUT).not.toHaveBeenCalled();
  });

  it('stores a first receipt without deleting anything', async () => {
    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { receiptUrl: NEW_URL },
    });
    expect(mockDeleteRegistered).not.toHaveBeenCalled();
  });

  it('replaces a receipt and deletes only the OLD url through the registry helper', async () => {
    mockFindFirst.mockResolvedValue(baseOrder({ receiptUrl: OLD_URL }));

    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);

    expect(result.success).toBe(true);
    expect(mockDeleteRegistered).toHaveBeenCalledTimes(1);
    expect(mockDeleteRegistered).toHaveBeenCalledWith({ orderId: ORDER_ID, url: OLD_URL });
    expect(mockDeleteUT).not.toHaveBeenCalled();
  });

  it('is a no-op success when the url equals the stored one', async () => {
    mockFindFirst.mockResolvedValue(baseOrder({ receiptUrl: NEW_URL }));

    const result = await updateOrderReceipt(ORDER_ID, NEW_URL);

    expect(result.success).toBe(true);
    expect(mockDeleteRegistered).not.toHaveBeenCalled();
    expect(mockDeleteUT).not.toHaveBeenCalled();
  });
});

describe('AZ-005 · rejectBankTransfer receipt cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteRegistered.mockResolvedValue({ deleted: true });
    mockSession('admin-1', 'admin');
    mockTransaction.mockResolvedValue(undefined);
  });

  it('deletes the previous receipt via deleteRegisteredReceiptFile, never deleteUTFiles', async () => {
    mockFindFirst.mockResolvedValue(baseOrder({ receiptUrl: OLD_URL }));

    const result = await rejectBankTransfer(ORDER_ID);

    expect(result.success).toBe(true);
    expect(mockDeleteRegistered).toHaveBeenCalledWith({ orderId: ORDER_ID, url: OLD_URL });
    expect(mockDeleteUT).not.toHaveBeenCalled();
  });
});
