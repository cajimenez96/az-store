import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';

export async function createTestCart(
  userId?: string,
  overrides: Record<string, unknown> = {}
) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return prisma.cart.create({
    data: {
      sessionCartId: `test-session-${suffix}`,
      userId: userId ?? null,
      items: [],
      itemsPrice: new Prisma.Decimal(0),
      shippingPrice: new Prisma.Decimal(0),
      taxPrice: new Prisma.Decimal(0),
      totalPrice: new Prisma.Decimal(0),
      ...overrides,
    },
  });
}
