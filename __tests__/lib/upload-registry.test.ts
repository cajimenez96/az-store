jest.mock('@/db/prisma', () => ({
  prisma: {
    uploadedFile: { findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn(), upsert: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));
jest.mock('@/lib/uploadthing-helpers', () => ({ deleteUTFiles: jest.fn() }));

import { prisma } from '@/db/prisma';
import { deleteUTFiles } from '@/lib/uploadthing-helpers';
import { deleteRegisteredReceiptFile } from '@/lib/uploads/registry';

const findUnique = prisma.uploadedFile.findUnique as jest.Mock;
const del = prisma.uploadedFile.delete as jest.Mock;
const deleteMany = prisma.uploadedFile.deleteMany as jest.Mock;
const queryRaw = prisma.$queryRaw as unknown as jest.Mock;

const URL_OK = 'https://utfs.io/f/KEY1.jpg';
const ORDER = 'order-1';
const row = (o: Record<string, unknown> = {}) => ({
  id: 'r1',
  key: 'KEY1.jpg',
  url: URL_OK,
  userId: 'u1',
  orderId: ORDER,
  purpose: 'RECEIPT',
  ...o,
});

describe('deleteRegisteredReceiptFile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    queryRaw.mockResolvedValue([{ referenced: false }]);
    del.mockResolvedValue({});
    deleteMany.mockResolvedValue({ count: 1 });
  });

  it('skips an invalid URL', async () => {
    const r = await deleteRegisteredReceiptFile({ orderId: ORDER, url: 'https://evil.com/f/K' });
    expect(r.deleted).toBe(false);
    expect(deleteUTFiles).not.toHaveBeenCalled();
  });

  it('skips a key that is not registered', async () => {
    findUnique.mockResolvedValue(null);
    const r = await deleteRegisteredReceiptFile({ orderId: ORDER, url: URL_OK });
    expect(r.deleted).toBe(false);
    expect(deleteUTFiles).not.toHaveBeenCalled();
  });

  it('skips a file registered to another order', async () => {
    findUnique.mockResolvedValue(row({ orderId: 'other' }));
    const r = await deleteRegisteredReceiptFile({ orderId: ORDER, url: URL_OK });
    expect(r.deleted).toBe(false);
    expect(deleteUTFiles).not.toHaveBeenCalled();
  });

  it('skips a file whose purpose is IMAGE', async () => {
    findUnique.mockResolvedValue(row({ purpose: 'IMAGE' }));
    const r = await deleteRegisteredReceiptFile({ orderId: ORDER, url: URL_OK });
    expect(r.deleted).toBe(false);
    expect(deleteUTFiles).not.toHaveBeenCalled();
  });

  it('skips a key referenced elsewhere', async () => {
    findUnique.mockResolvedValue(row());
    queryRaw.mockResolvedValue([{ referenced: true }]);
    const r = await deleteRegisteredReceiptFile({ orderId: ORDER, url: URL_OK });
    expect(r.deleted).toBe(false);
    expect(deleteUTFiles).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it('deletes the file and its registry row when every condition holds', async () => {
    findUnique.mockResolvedValue(row());
    const r = await deleteRegisteredReceiptFile({ orderId: ORDER, url: URL_OK });
    expect(r).toEqual({ deleted: true });
    expect(deleteUTFiles).toHaveBeenCalledWith([URL_OK]);
    expect(deleteMany).toHaveBeenCalledWith({ where: { key: 'KEY1.jpg' } });
  });

  it('never throws when the database fails', async () => {
    findUnique.mockRejectedValue(new Error('db down'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(deleteRegisteredReceiptFile({ orderId: ORDER, url: URL_OK })).resolves.toMatchObject({
      deleted: false,
    });
    spy.mockRestore();
  });
});
