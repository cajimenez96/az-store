import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

const connectionString = `${process.env.DATABASE_URL}`;

function createPrismaClient() {
  let client: PrismaClient;

  if (connectionString.includes('neon.tech')) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    client = new PrismaClient({ adapter });
  } else {
    client = new PrismaClient();
  }

  return client.$extends({
    result: {
      product: {
        rating: {
          compute(product) {
            return product.rating.toString();
          },
        },
      },
      cart: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(cart) {
            return cart.itemsPrice.toString();
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(cart) {
            return cart.shippingPrice.toString();
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(cart) {
            return cart.taxPrice.toString();
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(cart) {
            return cart.totalPrice.toString();
          },
        },
      },
      order: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(cart) {
            return cart.itemsPrice.toString();
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(cart) {
            return cart.shippingPrice.toString();
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(cart) {
            return cart.taxPrice.toString();
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(cart) {
            return cart.totalPrice.toString();
          },
        },
        discountPrice: {
          needs: { discountPrice: true },
          compute(order) {
            return order.discountPrice ? order.discountPrice.toString() : null;
          },
        },
      },
      // Fase 2: `priceUsed` (Decimal) -> string para mantener el contrato
      // que ya usaba el frontend con `OrderItem.price`.
      orderItem: {
        priceUsed: {
          needs: { priceUsed: true },
          compute(item) {
            return item.priceUsed.toString();
          },
        },
      },
      // Fase 2: `Price.value` (Decimal) -> string para no romper `Product.prices`.
      price: {
        value: {
          needs: { value: true },
          compute(price) {
            return price.value.toString();
          },
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
