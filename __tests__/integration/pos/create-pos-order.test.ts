import { prisma } from '@/db/prisma';
import { createPosOrder } from '@/lib/actions/order.actions';
import type { CartItem } from '@/types';
import {
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
} from '../../factories';

describe('3.2 · createPosOrder — integration', () => {
  let productId: string;
  let variantId: string;
  let productName: string;
  let productSlug: string;

  beforeAll(async () => {
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    const variant = await createTestVariant(product.id, size.id, 10);

    productId = product.id;
    variantId = variant.id;
    productName = product.name;
    productSlug = product.slug;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function makeItem(qty: number, size = 'M'): CartItem {
    return {
      productId,
      name: productName,
      slug: productSlug,
      qty,
      image: '/images/test.jpg',
      price: '50.00',
      size,
    };
  }

  it('creates a paid, delivered order and decrements stock', async () => {
    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const result = await createPosOrder({
      items: [makeItem(2)],
      paymentMethod: 'Efectivo',
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    expect(order?.isPaid).toBe(true);
    expect(order?.isDelivered).toBe(true);
    expect(order?.paidAt).not.toBeNull();
    expect(order?.deliveredAt).not.toBeNull();

    const updatedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(updatedVariant?.stock).toBe(stockBefore - 2);
  });

  it('rolls back entirely when stock is insufficient — no order, no stock change', async () => {
    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const result = await createPosOrder({
      items: [makeItem(stockBefore + 5)],
      paymentMethod: 'Efectivo',
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Stock insuficiente/i);

    const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfter).toBe(stockBefore);
  });

  it('associates order to "Consumidor Final" when no customer data is provided', async () => {
    const result = await createPosOrder({
      items: [makeItem(1)],
      paymentMethod: 'Efectivo',
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    const customer = await prisma.user.findUnique({ where: { id: order!.userId } });

    expect(customer?.email).toBe('consumidorfinal@local.store');
    expect(customer?.name).toBe('Consumidor Final');
  });

  it('creates a new customer user when provided email does not exist in DB', async () => {
    const uniqueEmail = `newcustomer-${Date.now()}@test.com`;
    const customerName = 'Juan Pérez';

    const result = await createPosOrder({
      items: [makeItem(1)],
      paymentMethod: 'Efectivo',
      customerEmail: uniqueEmail,
      customerName,
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    const customer = await prisma.user.findUnique({ where: { id: order!.userId } });

    expect(customer?.email).toBe(uniqueEmail);
    expect(customer?.name).toBe(customerName);
    expect(customer?.role).toBe('user');
  });

  it('finds existing customer by DNI and associates order without creating a duplicate', async () => {
    const uniqueDni = `DNI-${Date.now()}`;
    const existingUser = await prisma.user.create({
      data: {
        name: 'Cliente Existente',
        email: `existing-${Date.now()}@test.com`,
        dni: uniqueDni,
        role: 'user',
      },
    });

    const result = await createPosOrder({
      items: [makeItem(1)],
      paymentMethod: 'Efectivo',
      customerDni: uniqueDni,
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    expect(order?.userId).toBe(existingUser.id);

    const duplicates = await prisma.user.findMany({ where: { dni: uniqueDni } });
    expect(duplicates.length).toBe(1);
  });
});
