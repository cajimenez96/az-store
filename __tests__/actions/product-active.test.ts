/**
 * Product.isActive — admin toggle + storefront visibility.
 * Inactive products must stay visible to the admin but be hidden from every
 * customer-facing read.
 */

jest.mock('query-string', () => ({ stringifyUrl: jest.fn(), parse: jest.fn() }));
jest.mock('@/lib/auth-guard', () => ({
  requireAdmin: jest.fn(),
  requireAdminOrSeller: jest.fn(),
  assertAdmin: jest.fn(),
  assertAdminOrSeller: jest.fn(),
}));
jest.mock('@/lib/uploadthing-helpers', () => ({ deleteUTFiles: jest.fn() }));
jest.mock('@/lib/actions/setting.actions', () => ({ getSetting: jest.fn() }));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
jest.mock('@/db/prisma', () => ({
  prisma: {
    product: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { assertAdminOrSeller } from '@/lib/auth-guard';
import {
  getAllProducts,
  getProductBySlug,
  getLatestProducts,
  getFeaturedProducts,
  toggleProductActive,
} from '../../lib/actions/product.actions';

const findFirst = prisma.product.findFirst as jest.Mock;
const findMany = prisma.product.findMany as jest.Mock;
const count = prisma.product.count as jest.Mock;
const update = prisma.product.update as jest.Mock;
const guard = assertAdminOrSeller as jest.Mock;

/** In-memory catalogue that honours the `isActive` / `slug` parts of `where`. */
const catalogue = [
  { id: 'p1', slug: 'active-shirt', isActive: true },
  { id: 'p2', slug: 'hidden-shirt', isActive: false },
];

function matches(row: (typeof catalogue)[number], where: Record<string, unknown> = {}) {
  if (where.slug !== undefined && row.slug !== where.slug) return false;
  if (where.isActive !== undefined && row.isActive !== where.isActive) return false;
  return true;
}

describe('Product.isActive', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    guard.mockResolvedValue({ user: { role: 'admin', id: 'u1' } });
    findMany.mockImplementation(async ({ where }: { where: Record<string, unknown> }) =>
      catalogue.filter((r) => matches(r, where))
    );
    count.mockImplementation(async ({ where }: { where: Record<string, unknown> }) =>
      catalogue.filter((r) => matches(r, where)).length
    );
    findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) =>
      catalogue.find((r) => matches(r, where)) ?? null
    );
  });

  describe('toggleProductActive', () => {
    it('flips an active product to inactive', async () => {
      findFirst.mockResolvedValueOnce({ id: 'p1', isActive: true });
      update.mockResolvedValueOnce({ id: 'p1', isActive: false });

      const result = await toggleProductActive('p1');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { isActive: false },
      });
      expect(result).toMatchObject({ success: true, isActive: false });
      expect(revalidatePath).toHaveBeenCalledWith('/admin/products');
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('flips an inactive product to active', async () => {
      findFirst.mockResolvedValueOnce({ id: 'p2', isActive: false });
      update.mockResolvedValueOnce({ id: 'p2', isActive: true });

      const result = await toggleProductActive('p2');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'p2' },
        data: { isActive: true },
      });
      expect(result).toMatchObject({ success: true, isActive: true });
    });

    it('rejects callers that are not admin or seller', async () => {
      guard.mockRejectedValueOnce(new Error('No autorizado'));

      const result = await toggleProductActive('p1');

      expect(result.success).toBe(false);
      expect(update).not.toHaveBeenCalled();
    });

    it('fails when the product does not exist', async () => {
      findFirst.mockResolvedValueOnce(null);

      const result = await toggleProductActive('missing');

      expect(result.success).toBe(false);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('getAllProducts', () => {
    it('hides inactive products by default (storefront)', async () => {
      const { data } = await getAllProducts({ query: '', page: 1 });

      expect(data.map((p: { id: string }) => p.id)).toEqual(['p1']);
    });

    it('includes inactive products when includeInactive is true (admin)', async () => {
      const { data } = await getAllProducts({
        query: '',
        page: 1,
        includeInactive: true,
      });

      expect(data.map((p: { id: string }) => p.id)).toEqual(['p1', 'p2']);
    });

    it('applies the same visibility rule to the page count', async () => {
      await getAllProducts({ query: '', page: 1, limit: 1 });
      expect(count.mock.calls[0][0].where).toMatchObject({ isActive: true });

      await getAllProducts({ query: '', page: 1, limit: 1, includeInactive: true });
      expect(count.mock.calls[1][0].where).not.toHaveProperty('isActive');
    });
  });

  describe('getProductBySlug', () => {
    it('returns the product when it is active', async () => {
      const product = await getProductBySlug('active-shirt');
      expect(product).toMatchObject({ id: 'p1' });
    });

    it('treats an inactive product as not found', async () => {
      const product = await getProductBySlug('hidden-shirt');
      expect(product).toBeNull();
    });
  });

  describe('latest and featured listings', () => {
    it('getLatestProducts excludes inactive products', async () => {
      await getLatestProducts();
      expect(findMany.mock.calls[0][0].where).toMatchObject({ isActive: true });
    });

    it('getFeaturedProducts excludes inactive products', async () => {
      await getFeaturedProducts();
      expect(findMany.mock.calls[0][0].where).toMatchObject({
        isFeatured: true,
        isActive: true,
      });
    });
  });
});
