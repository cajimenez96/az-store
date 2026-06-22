import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';

export async function createTestCategory(overrides: Record<string, unknown> = {}) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return prisma.category.create({
    data: {
      name: `Test Category ${suffix}`,
      slug: `test-category-${suffix}`,
      ...overrides,
    },
  });
}

export async function createTestBrand(overrides: Record<string, unknown> = {}) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return prisma.brand.create({
    data: {
      name: `Test Brand ${suffix}`,
      slug: `test-brand-${suffix}`,
      ...overrides,
    },
  });
}

export async function createTestSize(
  categoryId: string,
  name?: string,
  overrides: Record<string, unknown> = {}
) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return prisma.size.create({
    data: {
      name: name ?? `Size-${suffix}`,
      categoryId,
      ...overrides,
    },
  });
}

export async function createTestProduct(
  categoryId: string,
  brandId: string,
  overrides: Record<string, unknown> = {}
) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  const product = await prisma.product.create({
    data: {
      name: `Test Product ${suffix}`,
      slug: `test-product-${suffix}`,
      categoryId,
      brandId,
      description: 'Test product description',
      images: [],
      ...overrides,
    },
  });
  // Fase 2: crear las dos filas de Price (CASH + MERCADOPAGO) por defecto
  await prisma.price.createMany({
    data: [
      { productId: product.id, paymentMethod: 'CASH', value: new Prisma.Decimal(100) },
      { productId: product.id, paymentMethod: 'MERCADOPAGO', value: new Prisma.Decimal(110) },
    ],
  });
  return product;
}

export async function createTestVariant(
  productId: string,
  sizeId: string,
  stock = 10,
  overrides: Record<string, unknown> = {}
) {
  return prisma.productVariant.create({
    data: {
      productId,
      sizeId,
      stock,
      ...overrides,
    },
  });
}
