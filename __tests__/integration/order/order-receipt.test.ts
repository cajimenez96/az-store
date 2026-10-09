jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/uploadthing-helpers', () => ({
  deleteUTFiles: jest.fn().mockResolvedValue(undefined),
}));

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { deleteUTFiles } from '@/lib/uploadthing-helpers';
import { rejectBankTransfer, updateOrderReceipt } from '@/lib/actions/order.actions';
import { registerUpload } from '@/lib/uploads/registry';
import {
  createTestUser,
  createTestAdmin,
  createTestCategory,
  createTestBrand,
  createTestProduct,
  createTestOrder,
} from '../../factories';

const mockAuth = auth as unknown as jest.Mock;
const mockDeleteUT = deleteUTFiles as jest.Mock;

const uniq = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const urlFor = (key: string) => `https://utfs.io/f/${key}`;

function actAs(user: { id: string; role: string }) {
  mockAuth.mockResolvedValue({ user: { id: user.id, role: user.role } });
}

describe('AZ-005 · order receipts — integration', () => {
  let owner: { id: string; role: string };
  let otherUser: { id: string; role: string };
  let admin: { id: string; role: string };
  let categoryId: string;
  let brandId: string;

  beforeAll(async () => {
    owner = await createTestUser();
    otherUser = await createTestUser();
    admin = await createTestAdmin();
    categoryId = (await createTestCategory()).id;
    brandId = (await createTestBrand()).id;
  });

  beforeEach(() => {
    mockDeleteUT.mockClear();
    actAs(owner);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function registerReceipt(userId: string, orderId: string, prefix: string) {
    const key = `${prefix}_${uniq()}.jpg`;
    await registerUpload({ key, url: urlFor(key), userId, orderId, purpose: 'RECEIPT' });
    return { key, url: urlFor(key) };
  }

  it('owner replaces the receipt: old file deleted once and its registry row removed', async () => {
    const order = await createTestOrder(owner.id);
    const oldFile = await registerReceipt(owner.id, order.id, 'old');
    const newFile = await registerReceipt(owner.id, order.id, 'new');

    expect((await updateOrderReceipt(order.id, oldFile.url)).success).toBe(true);
    mockDeleteUT.mockClear();

    const result = await updateOrderReceipt(order.id, newFile.url);

    expect(result.success).toBe(true);
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.receiptUrl).toBe(newFile.url);
    expect(mockDeleteUT).toHaveBeenCalledTimes(1);
    expect(mockDeleteUT).toHaveBeenCalledWith([oldFile.url]);
    expect(await prisma.uploadedFile.findUnique({ where: { key: oldFile.key } })).toBeNull();
    expect(await prisma.uploadedFile.findUnique({ where: { key: newFile.key } })).not.toBeNull();
  });

  it('rejects a product image URL as receipt and leaves the image untouched', async () => {
    const order = await createTestOrder(owner.id);
    const imageKey = `product_${uniq()}.jpg`;
    const product = await createTestProduct(categoryId, brandId, { images: [urlFor(imageKey)] });
    await registerUpload({
      key: imageKey,
      url: urlFor(imageKey),
      userId: admin.id,
      orderId: null,
      purpose: 'IMAGE',
    });

    const result = await updateOrderReceipt(order.id, urlFor(imageKey));

    expect(result.success).toBe(false);
    expect(mockDeleteUT).not.toHaveBeenCalled();
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.receiptUrl).toBeNull();
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.images).toEqual([
      urlFor(imageKey),
    ]);
    expect(await prisma.uploadedFile.findUnique({ where: { key: imageKey } })).not.toBeNull();
  });

  it('rejects a receipt change on a paid order', async () => {
    const order = await createTestOrder(owner.id, { isPaid: true, paidAt: new Date() });
    const file = await registerReceipt(owner.id, order.id, 'paid');

    const result = await updateOrderReceipt(order.id, file.url);

    expect(result).toMatchObject({ success: false, message: 'La orden ya fue pagada' });
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.receiptUrl).toBeNull();
    expect(mockDeleteUT).not.toHaveBeenCalled();
  });

  it("rejects a file another user registered for the same order", async () => {
    const order = await createTestOrder(owner.id);
    const foreign = await registerReceipt(otherUser.id, order.id, 'foreign');

    const result = await updateOrderReceipt(order.id, foreign.url);

    expect(result).toMatchObject({
      success: false,
      message: 'El comprobante no corresponde a una subida tuya para esta orden',
    });
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.receiptUrl).toBeNull();
    expect(mockDeleteUT).not.toHaveBeenCalled();
  });

  it('legacy bad data: rejecting a transfer never deletes a product image stored as receiptUrl', async () => {
    const imageKey = `legacy_${uniq()}.jpg`;
    const imageUrl = urlFor(imageKey);
    await createTestProduct(categoryId, brandId, { images: [imageUrl] });
    const order = await createTestOrder(owner.id, { receiptUrl: imageUrl });
    actAs(admin);

    const result = await rejectBankTransfer(order.id);

    expect(result.success).toBe(true);
    expect(mockDeleteUT).not.toHaveBeenCalled();
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.receiptUrl).toBeNull();
  });

  it('rejecting a transfer deletes its own registered receipt once', async () => {
    const order = await createTestOrder(owner.id);
    const file = await registerReceipt(owner.id, order.id, 'reject');
    await prisma.order.update({ where: { id: order.id }, data: { receiptUrl: file.url } });
    actAs(admin);

    const result = await rejectBankTransfer(order.id);

    expect(result.success).toBe(true);
    expect(mockDeleteUT).toHaveBeenCalledTimes(1);
    expect(mockDeleteUT).toHaveBeenCalledWith([file.url]);
  });
});
