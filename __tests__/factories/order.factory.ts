import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';

const DEFAULT_SHIPPING_ADDRESS = {
  street: 'Test St 123',
  city: 'Buenos Aires',
  province: 'CABA',
  postalCode: '1000',
  country: 'AR',
  fullName: 'Test User',
};

export async function createTestOrder(
  userId: string,
  overrides: Record<string, unknown> = {}
) {
  return prisma.order.create({
    data: {
      userId,
      shippingAddress: DEFAULT_SHIPPING_ADDRESS,
      paymentMethod: 'TransferenciaBancaria',
      itemsPrice: new Prisma.Decimal('100.00'),
      shippingPrice: new Prisma.Decimal('0.00'),
      taxPrice: new Prisma.Decimal('0.00'),
      totalPrice: new Prisma.Decimal('100.00'),
      isPaid: false,
      isDelivered: false,
      ...overrides,
    },
  });
}

export async function createTestOrderItem(
  orderId: string,
  productId: string,
  overrides: Record<string, unknown> = {}
) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return prisma.orderItem.create({
    data: {
      orderId,
      productId,
      qty: 1,
      priceUsed: new Prisma.Decimal('100.00'),
      paymentMethod: 'CASH',
      name: `Test Product ${suffix}`,
      slug: `test-product-${suffix}`,
      image: '/images/test-product.jpg',
      ...overrides,
    },
  });
}
