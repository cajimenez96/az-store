/**
 * AZ-2.1 — Cascade delete → reassignment a defaults.
 * Verifica que borrar Brand/Category reasigna productos antes de eliminar.
 */

jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));
jest.mock('@/lib/auth-guard', () => ({
  requireAdmin: jest.fn().mockResolvedValue(undefined),
  requireAdminOrSeller: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/db/prisma', () => ({
  prisma: {
    brand: { findFirst: jest.fn() },
    category: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/db/prisma';
import { deleteBrand } from '../../lib/actions/brand.actions';
import { deleteCategory } from '../../lib/actions/category.actions';
import { DEFAULT_BRAND_ID, DEFAULT_CATEGORY_ID } from '../../lib/constants';

const mockTransaction = prisma.$transaction as jest.Mock;
const mockBrandFindFirst = prisma.brand.findFirst as jest.Mock;

function buildBrandTx() {
  return {
    brand: {
      upsert: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    product: {
      updateMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
  };
}

function buildCategoryTx() {
  return {
    category: {
      upsert: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    product: {
      updateMany: jest.fn().mockResolvedValue({ count: 5 }),
    },
  };
}

describe('AZ-2.1 · Cascade delete → reassignment a defaults', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ─── deleteBrand ──────────────────────────────────────────────────────────

  describe('deleteBrand', () => {
    it('rechaza eliminar la marca predeterminada del sistema', async () => {
      const result = await deleteBrand(DEFAULT_BRAND_ID);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/predeterminada/);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('lanza error cuando la marca no existe', async () => {
      mockBrandFindFirst.mockResolvedValueOnce(null);

      const result = await deleteBrand('nonexistent-brand');

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/no encontrada/i);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('hace upsert del sentinel, reasigna productos y elimina la marca', async () => {
      mockBrandFindFirst.mockResolvedValueOnce({ id: 'brand-1', name: 'Nike' });

      const mockTx = buildBrandTx();
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      const result = await deleteBrand('brand-1');

      expect(result.success).toBe(true);
      expect(mockTx.brand.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: DEFAULT_BRAND_ID } })
      );
      expect(mockTx.product.updateMany).toHaveBeenCalledWith({
        where: { brandId: 'brand-1' },
        data: { brandId: DEFAULT_BRAND_ID },
      });
      expect(mockTx.brand.delete).toHaveBeenCalledWith({ where: { id: 'brand-1' } });
    });

    it('el orden de operaciones garantiza que la reasignación ocurre antes del delete', async () => {
      mockBrandFindFirst.mockResolvedValueOnce({ id: 'brand-2', name: 'Adidas' });

      const callOrder: string[] = [];
      const mockTx = {
        brand: {
          upsert: jest.fn().mockImplementation(() => { callOrder.push('upsert'); return Promise.resolve({}); }),
          delete: jest.fn().mockImplementation(() => { callOrder.push('delete'); return Promise.resolve({}); }),
        },
        product: {
          updateMany: jest.fn().mockImplementation(() => { callOrder.push('updateMany'); return Promise.resolve({ count: 1 }); }),
        },
      };
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      await deleteBrand('brand-2');

      expect(callOrder).toEqual(['upsert', 'updateMany', 'delete']);
    });
  });

  // ─── deleteCategory ───────────────────────────────────────────────────────

  describe('deleteCategory', () => {
    it('rechaza eliminar la categoría predeterminada del sistema', async () => {
      const result = await deleteCategory(DEFAULT_CATEGORY_ID);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/predeterminada/);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('hace upsert del sentinel, reasigna productos y elimina la categoría', async () => {
      const mockTx = buildCategoryTx();
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      const result = await deleteCategory('category-1');

      expect(result.success).toBe(true);
      expect(mockTx.category.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: DEFAULT_CATEGORY_ID } })
      );
      expect(mockTx.product.updateMany).toHaveBeenCalledWith({
        where: { categoryId: 'category-1' },
        data: { categoryId: DEFAULT_CATEGORY_ID },
      });
      expect(mockTx.category.delete).toHaveBeenCalledWith({ where: { id: 'category-1' } });
    });

    it('el orden de operaciones garantiza que la reasignación ocurre antes del delete', async () => {
      const callOrder: string[] = [];
      const mockTx = {
        category: {
          upsert: jest.fn().mockImplementation(() => { callOrder.push('upsert'); return Promise.resolve({}); }),
          delete: jest.fn().mockImplementation(() => { callOrder.push('delete'); return Promise.resolve({}); }),
        },
        product: {
          updateMany: jest.fn().mockImplementation(() => { callOrder.push('updateMany'); return Promise.resolve({ count: 2 }); }),
        },
      };
      mockTransaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
      );

      await deleteCategory('category-2');

      expect(callOrder).toEqual(['upsert', 'updateMany', 'delete']);
    });
  });
});
