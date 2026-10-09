jest.mock('@/lib/uploadthing-helpers', () => ({
  deleteUTFiles: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/db/prisma';
import { deleteUTFiles } from '@/lib/uploadthing-helpers';
import {
  deleteRegisteredReceiptFile,
  findRegisteredReceipt,
  isKeyReferencedElsewhere,
  registerUpload,
} from '@/lib/uploads/registry';
import {
  createTestUser,
  createTestCategory,
  createTestBrand,
  createTestProduct,
  createTestOrder,
} from '../../factories';

const uniq = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const urlFor = (key: string) => `https://utfs.io/f/${key}`;

describe('uploads registry — integration', () => {
  let userId: string;
  let otherUserId: string;
  let categoryId: string;
  let brandId: string;

  beforeAll(async () => {
    userId = (await createTestUser()).id;
    otherUserId = (await createTestUser()).id;
    categoryId = (await createTestCategory()).id;
    brandId = (await createTestBrand()).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('registerUpload ownership', () => {
    it('never reassigns an already registered key to another user, order or purpose', async () => {
      const orderA = await createTestOrder(userId);
      const orderB = await createTestOrder(otherUserId);
      const key = `own_${uniq()}.jpg`;

      await registerUpload({ key, url: urlFor(key), userId, orderId: orderA.id, purpose: 'RECEIPT' });
      await registerUpload({
        key,
        url: urlFor(key),
        userId: otherUserId,
        orderId: orderB.id,
        purpose: 'IMAGE',
      });

      const row = await prisma.uploadedFile.findUnique({ where: { key } });
      expect(row).toMatchObject({ userId, orderId: orderA.id, purpose: 'RECEIPT' });
    });
  });

  describe('registerUpload / findRegisteredReceipt', () => {
    it('upserts by key and finds the receipt only for its user and order', async () => {
      const order = await createTestOrder(userId);
      const key = `reg_${uniq()}.jpg`;

      await registerUpload({ key, url: urlFor(key), userId, orderId: order.id, purpose: 'RECEIPT' });
      await registerUpload({ key, url: urlFor(key), userId, orderId: order.id, purpose: 'RECEIPT' });

      expect(await prisma.uploadedFile.count({ where: { key } })).toBe(1);
      expect(await findRegisteredReceipt({ key, userId, orderId: order.id })).toMatchObject({ key });
      expect(await findRegisteredReceipt({ key, userId: otherUserId, orderId: order.id })).toBeNull();
      const otherOrder = await createTestOrder(userId);
      expect(await findRegisteredReceipt({ key, userId, orderId: otherOrder.id })).toBeNull();
      expect(await findRegisteredReceipt({ key: 'missing', userId, orderId: order.id })).toBeNull();
    });

    it('does not treat an IMAGE upload as a receipt', async () => {
      const order = await createTestOrder(userId);
      const key = `img_${uniq()}.jpg`;
      await registerUpload({ key, url: urlFor(key), userId, orderId: null, purpose: 'IMAGE' });
      expect(await findRegisteredReceipt({ key, userId, orderId: order.id })).toBeNull();
    });
  });

  describe('isKeyReferencedElsewhere', () => {
    it('detects the key in Product.images', async () => {
      const key = `prod_${uniq()}.jpg`;
      await createTestProduct(categoryId, brandId, { images: [urlFor(key)] });
      expect(await isKeyReferencedElsewhere(key, { exceptOrderId: crypto.randomUUID() })).toBe(true);
    });

    it('detects the key in ProductColor.images', async () => {
      const key = `color_${uniq()}.jpg`;
      const product = await createTestProduct(categoryId, brandId);
      const color = await prisma.color.create({ data: { name: `c-${uniq()}`, hex: '#000000' } });
      await prisma.productColor.create({
        data: { productId: product.id, colorId: color.id, images: [urlFor(key)] },
      });
      expect(await isKeyReferencedElsewhere(key, { exceptOrderId: crypto.randomUUID() })).toBe(true);
    });

    it('detects the key in PromoBanner.image', async () => {
      const key = `banner_${uniq()}.jpg`;
      await prisma.promoBanner.create({
        data: { title: `b-${uniq()}`, image: urlFor(key) },
      });
      expect(await isKeyReferencedElsewhere(key, { exceptOrderId: crypto.randomUUID() })).toBe(true);
    });

    it('detects the key in User.image', async () => {
      const key = `avatar_${uniq()}.jpg`;
      await createTestUser({ image: urlFor(key) });
      expect(await isKeyReferencedElsewhere(key, { exceptOrderId: crypto.randomUUID() })).toBe(true);
    });

    it("detects another order's receiptUrl but ignores the excepted order", async () => {
      const key = `rcpt_${uniq()}.jpg`;
      const a = await createTestOrder(userId, { receiptUrl: urlFor(key) });
      const b = await createTestOrder(userId);
      expect(await isKeyReferencedElsewhere(key, { exceptOrderId: b.id })).toBe(true);
      expect(await isKeyReferencedElsewhere(key, { exceptOrderId: a.id })).toBe(false);
    });

    it('returns false for an unreferenced key and treats LIKE wildcards literally', async () => {
      const suffix = uniq();
      await createTestUser({ image: urlFor(`abcXdef_${suffix}.jpg`) });
      // `_` and `%` must not behave as wildcards.
      expect(await isKeyReferencedElsewhere(`abc_def_${suffix}.jpg`, { exceptOrderId: crypto.randomUUID() })).toBe(false);
      expect(await isKeyReferencedElsewhere('%', { exceptOrderId: crypto.randomUUID() })).toBe(false);
      expect(await isKeyReferencedElsewhere(`none_${suffix}.jpg`, { exceptOrderId: crypto.randomUUID() })).toBe(false);
    });
  });

  describe('deleteRegisteredReceiptFile', () => {
    it('deletes the unreferenced registered receipt of the order and its registry row', async () => {
      const key = `del_${uniq()}.jpg`;
      const order = await createTestOrder(userId, { receiptUrl: urlFor(key) });
      await registerUpload({ key, url: urlFor(key), userId, orderId: order.id, purpose: 'RECEIPT' });

      const result = await deleteRegisteredReceiptFile({ orderId: order.id, url: urlFor(key) });

      expect(result).toEqual({ deleted: true });
      expect(deleteUTFiles).toHaveBeenCalledWith([urlFor(key)]);
      expect(await prisma.uploadedFile.findUnique({ where: { key } })).toBeNull();
    });

    it('refuses a key that a product image also uses', async () => {
      const key = `shared_${uniq()}.jpg`;
      await createTestProduct(categoryId, brandId, { images: [urlFor(key)] });
      const order = await createTestOrder(userId, { receiptUrl: urlFor(key) });
      await registerUpload({ key, url: urlFor(key), userId, orderId: order.id, purpose: 'RECEIPT' });

      const result = await deleteRegisteredReceiptFile({ orderId: order.id, url: urlFor(key) });

      expect(result.deleted).toBe(false);
      expect(deleteUTFiles).not.toHaveBeenCalled();
      expect(await prisma.uploadedFile.findUnique({ where: { key } })).not.toBeNull();
    });

    it('refuses an unregistered key', async () => {
      const key = `unreg_${uniq()}.jpg`;
      const order = await createTestOrder(userId, { receiptUrl: urlFor(key) });
      const result = await deleteRegisteredReceiptFile({ orderId: order.id, url: urlFor(key) });
      expect(result.deleted).toBe(false);
      expect(deleteUTFiles).not.toHaveBeenCalled();
    });
  });
});
