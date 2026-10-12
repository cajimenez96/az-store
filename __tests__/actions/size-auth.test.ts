/**
 * AZ-003 · Size server actions must be protected and must not persist
 * arbitrary client-supplied data.
 */

jest.mock('@/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/db/prisma', () => ({
  prisma: {
    size: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    category: { findUnique: jest.fn() },
    productVariant: { count: jest.fn() },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { DEFAULT_CATEGORY_ID, SIZE_NAME_MAX_LENGTH } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import {
  createSize,
  deleteSize,
  getSizesByCategory,
} from '../../lib/actions/size.actions';

const mockAuth = auth as unknown as jest.Mock;
const db = prisma as unknown as {
  size: { create: jest.Mock; delete: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
  category: { findUnique: jest.Mock };
  productVariant: { count: jest.Mock };
};

const CATEGORY_ID = '3f6c1a52-8d0e-4b7a-9c1d-2e5f7a8b9c01';
const SIZE_ID = '9b2d4e6f-1a3c-4d5e-8f70-a1b2c3d4e5f6';
const ACCESS_DENIED = 'Acceso denegado';

const asRole = (role?: string) =>
  mockAuth.mockResolvedValue(role ? { user: { id: 'u1', role } } : null);

describe('AZ-003 · size actions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    db.category.findUnique.mockResolvedValue({ id: CATEGORY_ID });
    db.size.create.mockImplementation(async ({ data }) => ({ id: SIZE_ID, ...data }));
    db.size.findUnique.mockResolvedValue({ id: SIZE_ID, name: 'M', categoryId: CATEGORY_ID });
    db.size.delete.mockResolvedValue({ id: SIZE_ID });
    db.size.findMany.mockResolvedValue([]);
    db.productVariant.count.mockResolvedValue(0);
  });

  describe.each([
    ['no session', undefined],
    ['role user', 'user'],
  ])('%s', (_label, role) => {
    beforeEach(() => asRole(role));

    it('createSize is denied without touching the DB', async () => {
      const res = await createSize({ name: 'M', categoryId: CATEGORY_ID });
      expect(res.success).toBe(false);
      expect(res.message).toContain(ACCESS_DENIED);
      expect(db.size.create).not.toHaveBeenCalled();
    });

    it('deleteSize is denied without touching the DB', async () => {
      const res = await deleteSize(SIZE_ID);
      expect(res.success).toBe(false);
      expect(res.message).toContain(ACCESS_DENIED);
      expect(db.size.delete).not.toHaveBeenCalled();
    });

    it('getSizesByCategory is denied without querying', async () => {
      const res = await getSizesByCategory(CATEGORY_ID);
      expect(res.success).toBe(false);
      expect(res.message).toContain(ACCESS_DENIED);
      expect(db.size.findMany).not.toHaveBeenCalled();
    });
  });

  describe('role seller', () => {
    beforeEach(() => asRole('seller'));

    it('cannot create or delete sizes', async () => {
      const c = await createSize({ name: 'M', categoryId: CATEGORY_ID });
      const d = await deleteSize(SIZE_ID);
      expect(c.success).toBe(false);
      expect(d.success).toBe(false);
      expect(db.size.create).not.toHaveBeenCalled();
      expect(db.size.delete).not.toHaveBeenCalled();
    });

    it('can list sizes by category', async () => {
      const res = await getSizesByCategory(CATEGORY_ID);
      expect(res.success).toBe(true);
      expect(db.size.findMany).toHaveBeenCalled();
    });
  });

  describe('role admin', () => {
    beforeEach(() => asRole('admin'));

    it('creates a size persisting only name and categoryId', async () => {
      const payload = {
        name: '  M  ',
        categoryId: CATEGORY_ID,
        id: 'evil-id',
        products: { create: [{ name: 'x' }] },
        variants: { create: [{ stock: 99 }] },
        category: { create: { name: 'y' } },
      } as any;
      const res = await createSize(payload);
      expect(res.success).toBe(true);
      expect(db.size.create).toHaveBeenCalledTimes(1);
      expect(db.size.create).toHaveBeenCalledWith({
        data: { name: 'M', categoryId: CATEGORY_ID },
      });
    });

    it.each([
      ['empty name', { name: '   ', categoryId: CATEGORY_ID }],
      ['non-uuid categoryId', { name: 'M', categoryId: 'not-a-uuid' }],
      ['name too long', { name: 'x'.repeat(51), categoryId: CATEGORY_ID }],
    ])('rejects invalid input (%s) without touching the DB', async (_l, data) => {
      const res = await createSize(data as any);
      expect(res.success).toBe(false);
      expect(db.size.create).not.toHaveBeenCalled();
      expect(db.category.findUnique).not.toHaveBeenCalled();
    });

    it('returns a readable error when the category does not exist', async () => {
      db.category.findUnique.mockResolvedValue(null);
      const res = await createSize({ name: 'M', categoryId: CATEGORY_ID });
      expect(res.success).toBe(false);
      expect(res.message).toBe('La categoría no existe');
      expect(db.size.create).not.toHaveBeenCalled();
    });

    it('exposes the size name limit as a named constant', () => {
      expect(SIZE_NAME_MAX_LENGTH).toBe(50);
    });

    it('accepts a name of exactly SIZE_NAME_MAX_LENGTH characters', async () => {
      const name = 'x'.repeat(SIZE_NAME_MAX_LENGTH);
      const res = await createSize({ name, categoryId: CATEGORY_ID });
      expect(res.success).toBe(true);
      expect(db.size.create).toHaveBeenCalledWith({ data: { name, categoryId: CATEGORY_ID } });
    });

    it('rejects a name of SIZE_NAME_MAX_LENGTH + 1 characters without touching the DB', async () => {
      const res = await createSize({
        name: 'x'.repeat(SIZE_NAME_MAX_LENGTH + 1),
        categoryId: CATEGORY_ID,
      });
      expect(res.success).toBe(false);
      expect(res.message).toContain(String(SIZE_NAME_MAX_LENGTH));
      expect(db.category.findUnique).not.toHaveBeenCalled();
      expect(db.size.create).not.toHaveBeenCalled();
    });

    it('trims the name before checking the length', async () => {
      const name = 'x'.repeat(SIZE_NAME_MAX_LENGTH);
      const res = await createSize({ name: `  ${name}  `, categoryId: CATEGORY_ID });
      expect(res.success).toBe(true);
      expect(db.size.create).toHaveBeenCalledWith({ data: { name, categoryId: CATEGORY_ID } });
    });

    it('maps a P2003 race on create (category deleted meanwhile) to a readable message', async () => {
      db.size.create.mockRejectedValue(
        Object.assign(new Error('Foreign key constraint failed on the field: `categoryId`'), {
          name: 'PrismaClientKnownRequestError',
          code: 'P2003',
        })
      );
      const res = await createSize({ name: 'M', categoryId: CATEGORY_ID });
      expect(res).toEqual({ success: false, message: 'La categoría no existe' });
    });

    it('still reports success when revalidatePath throws after a successful create', async () => {
      (revalidatePath as jest.Mock).mockImplementation(() => {
        throw new Error('revalidate boom');
      });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const res = await createSize({ name: 'M', categoryId: CATEGORY_ID });
      expect(db.size.create).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(true);
      expect(res.data).toMatchObject({ name: 'M' });
      expect(errorSpy).toHaveBeenCalledWith('[sizes] revalidate failed', expect.any(Error));
      errorSpy.mockRestore();
    });

    it('still reports success when revalidatePath throws after a successful delete', async () => {
      (revalidatePath as jest.Mock).mockImplementation(() => {
        throw new Error('revalidate boom');
      });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const res = await deleteSize(SIZE_ID);
      expect(db.size.delete).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(true);
      expect(errorSpy).toHaveBeenCalledWith('[sizes] revalidate failed', expect.any(Error));
      errorSpy.mockRestore();
    });

    it.each([
      ['singular', 1, 'lo usa 1 variante de producto'],
      ['plural', 3, 'lo usan 3 variantes de producto'],
    ])('uses the %s message when the size is in use', async (_l, count, text) => {
      db.productVariant.count.mockResolvedValue(count);
      const res = await deleteSize(SIZE_ID);
      expect(res.message).toContain(text);
    });

    it('uses the count-less message on a P2003 race', async () => {
      db.size.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { name: 'PrismaClientKnownRequestError', code: 'P2003' })
      );
      const res = await deleteSize(SIZE_ID);
      expect(res.message).toContain('lo usan variantes de producto');
      expect(res.message).not.toContain('"');
    });

    it('deletes an unused size', async () => {
      const res = await deleteSize(SIZE_ID);
      expect(res.success).toBe(true);
      expect(db.size.delete).toHaveBeenCalledWith({ where: { id: SIZE_ID } });
    });

    it('refuses to delete a size used by variants with a readable message', async () => {
      db.productVariant.count.mockResolvedValue(3);
      const res = await deleteSize(SIZE_ID);
      expect(res.success).toBe(false);
      expect(res.message).toContain('3 variantes');
      expect(res.message).toContain('"M"');
      expect(db.size.delete).not.toHaveBeenCalled();
    });

    it('rejects a non-uuid size id without touching the DB', async () => {
      const res = await deleteSize('nope');
      expect(res.success).toBe(false);
      expect(db.productVariant.count).not.toHaveBeenCalled();
      expect(db.size.delete).not.toHaveBeenCalled();
    });

    it('returns a readable message when the size does not exist', async () => {
      db.size.findUnique.mockResolvedValue(null);
      const res = await deleteSize(SIZE_ID);
      expect(res.success).toBe(false);
      expect(res.message).toBe('El talle no existe');
      expect(db.size.delete).not.toHaveBeenCalled();
    });

    it('maps a P2003 foreign-key race to a readable message', async () => {
      db.size.delete.mockRejectedValue(
        Object.assign(new Error('Foreign key constraint failed on the field: `sizeId`'), {
          name: 'PrismaClientKnownRequestError',
          code: 'P2003',
        })
      );
      const res = await deleteSize(SIZE_ID);
      expect(res.success).toBe(false);
      expect(res.message).toContain('No se puede eliminar el talle');
      expect(res.message).not.toContain('Foreign key');
    });

    it('maps a P2025 not-found race to a readable message', async () => {
      db.size.delete.mockRejectedValue(
        Object.assign(new Error('Record to delete does not exist.'), {
          name: 'PrismaClientKnownRequestError',
          code: 'P2025',
        })
      );
      const res = await deleteSize(SIZE_ID);
      expect(res.success).toBe(false);
      expect(res.message).toBe('El talle no existe');
    });

    // The system fallback category ("Sin categoría") has a fixed id that is NOT an
    // RFC-strict UUID. zod 3 accepts it; zod 4's `.uuid()` would not, so this test
    // pins the behaviour before anyone upgrades and silently breaks that category.
    it('accepts the default category id (fixed, non RFC-strict uuid)', async () => {
      db.category.findUnique.mockResolvedValue({ id: DEFAULT_CATEGORY_ID });
      db.size.findMany.mockResolvedValue([]);

      const created = await createSize({ name: 'Único', categoryId: DEFAULT_CATEGORY_ID });
      const listed = await getSizesByCategory(DEFAULT_CATEGORY_ID);

      expect(created.success).toBe(true);
      expect(listed.success).toBe(true);
    });

    it('rejects a non-uuid categoryId in getSizesByCategory', async () => {
      const res = await getSizesByCategory('nope');
      expect(res.success).toBe(false);
      expect(db.size.findMany).not.toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    let errorSpy: jest.SpyInstance;
    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => errorSpy.mockRestore());

    it.each([
      ['no session', undefined],
      ['role user', 'user'],
    ])('does not log denied access (%s)', async (_l, role) => {
      asRole(role);
      await createSize({ name: 'M', categoryId: CATEGORY_ID });
      await deleteSize(SIZE_ID);
      await getSizesByCategory(CATEGORY_ID);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('does not log validation errors', async () => {
      asRole('admin');
      await createSize({ name: '', categoryId: 'nope' });
      await deleteSize('nope');
      await getSizesByCategory('nope');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('does not log the mapped Prisma races', async () => {
      asRole('admin');
      const prismaError = (code: string) =>
        Object.assign(new Error(code), { name: 'PrismaClientKnownRequestError', code });
      db.size.create.mockRejectedValue(prismaError('P2003'));
      db.size.delete.mockRejectedValueOnce(prismaError('P2003'));
      await createSize({ name: 'M', categoryId: CATEGORY_ID });
      await deleteSize(SIZE_ID);
      db.size.delete.mockRejectedValueOnce(prismaError('P2025'));
      await deleteSize(SIZE_ID);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('logs an unexpected getSizesByCategory failure once and still returns the shape', async () => {
      asRole('admin');
      const boom = new Error('db down');
      db.size.findMany.mockRejectedValue(boom);
      const res = await getSizesByCategory(CATEGORY_ID);
      expect(res).toEqual({ success: false, message: 'db down' });
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('[sizes] getSizesByCategory failed', boom);
    });

    it('logs an unexpected createSize failure once and still returns the shape', async () => {
      asRole('admin');
      const boom = new Error('db down');
      db.size.create.mockRejectedValue(boom);
      const res = await createSize({ name: 'M', categoryId: CATEGORY_ID });
      expect(res).toEqual({ success: false, message: 'db down' });
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('[sizes] createSize failed', boom);
    });

    it('logs an unexpected deleteSize failure once and still returns the shape', async () => {
      asRole('admin');
      const boom = new Error('db down');
      db.size.delete.mockRejectedValue(boom);
      const res = await deleteSize(SIZE_ID);
      expect(res).toEqual({ success: false, message: 'db down' });
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('[sizes] deleteSize failed', boom);
    });
  });
});
