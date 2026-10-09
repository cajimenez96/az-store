import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { createSize, deleteSize } from '@/lib/actions/size.actions';
import {
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
} from '../../factories';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const asRole = (role?: string) =>
  mockAuth.mockResolvedValue(
    role ? { user: { id: '00000000-0000-0000-0000-0000000000b3', role } } : null
  );

describe('AZ-003 · size actions against the real DB', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it.each([
    ['anonymous', undefined],
    ['user', 'user'],
    ['seller', 'seller'],
  ])('%s cannot create or delete sizes', async (_l, role) => {
    asRole(role);
    const category = await createTestCategory();
    const existing = await createTestSize(category.id, 'KEEP');

    const created = await createSize({ name: 'HACK', categoryId: category.id });
    const deleted = await deleteSize(existing.id);

    expect(created.success).toBe(false);
    expect(deleted.success).toBe(false);
    expect(await prisma.size.count({ where: { categoryId: category.id } })).toBe(1);
    expect(await prisma.size.findUnique({ where: { id: existing.id } })).not.toBeNull();
  });

  it('admin creates a size with only name and categoryId, ignoring extra fields', async () => {
    asRole('admin');
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const product = await createTestProduct(category.id, brand.id);
    const forcedId = '11111111-1111-4111-8111-111111111111';

    const res = await createSize({
      name: 'XL',
      categoryId: category.id,
      id: forcedId,
      variants: { create: [{ productId: product.id, stock: 99 }] },
    } as any);

    expect(res.success).toBe(true);
    expect(res.data!.name).toBe('XL');
    expect(res.data!.id).not.toBe(forcedId);
    expect(await prisma.productVariant.count({ where: { productId: product.id } })).toBe(0);
  });

  it('admin gets a readable error for an unknown category', async () => {
    asRole('admin');
    const res = await createSize({
      name: 'M',
      categoryId: '22222222-2222-4222-8222-222222222222',
    });
    expect(res.success).toBe(false);
    expect(res.message).toBe('La categoría no existe');
  });

  it('refuses to delete a size used by a variant; the size still exists', async () => {
    asRole('admin');
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    await createTestVariant(product.id, size.id, 5);

    const res = await deleteSize(size.id);

    expect(res.success).toBe(false);
    expect(res.message).toContain('1 variante');
    expect(res.message).not.toMatch(/Foreign key|prisma/i);
    expect(await prisma.size.findUnique({ where: { id: size.id } })).not.toBeNull();
  });

  it('admin deletes an unused size', async () => {
    asRole('admin');
    const category = await createTestCategory();
    const size = await createTestSize(category.id, 'S');

    const res = await deleteSize(size.id);

    expect(res.success).toBe(true);
    expect(await prisma.size.findUnique({ where: { id: size.id } })).toBeNull();
  });
});
