/**
 * getPriceComparison quotes the same cart with both price lists on the server;
 * the UI only formats the result. It must never throw (informational UI).
 */

jest.mock('@/db/prisma', () => ({
  prisma: {
    product: { findFirst: jest.fn() },
  },
}));

import { prisma } from '@/db/prisma';
import { getPriceComparison } from '@/lib/pricing/compare';

const findFirst = prisma.product.findFirst as jest.Mock;

function makeProduct(id: string, cash: string, list: string, stock = 5) {
  return {
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    images: ['/img/base.jpg'],
    isActive: true,
    hasColorVariants: false,
    prices: [
      { paymentMethod: 'CASH', value: cash },
      { paymentMethod: 'MERCADOPAGO', value: list },
    ],
    variants: [{ id: `v-${id}`, stock, colorId: null, size: { name: 'M' }, productColor: null }],
  };
}

const catalog: Record<string, ReturnType<typeof makeProduct>> = {};

beforeEach(() => {
  for (const key of Object.keys(catalog)) delete catalog[key];
  findFirst.mockReset().mockImplementation(async ({ where }) => catalog[where.id] ?? null);
});

describe('getPriceComparison', () => {
  it('returns both totals and the savings for a mixed cart', async () => {
    catalog.a = makeProduct('a', '54000.00', '59990.00');
    catalog.b = makeProduct('b', '36000.00', '39950.00');

    const result = await getPriceComparison([
      { productId: 'a', size: 'M', qty: 1 },
      { productId: 'b', size: 'M', qty: 2 },
    ]);

    expect(result).toEqual({
      listTotal: 139890,
      cashTotal: 126000,
      amount: 13890,
      percent: 10,
    });
  });

  it('reports no savings when both lists are equal', async () => {
    catalog.a = makeProduct('a', '1000.00', '1000.00');

    const result = await getPriceComparison([{ productId: 'a', size: 'M', qty: 1 }]);

    expect(result).toEqual({ listTotal: 1000, cashTotal: 1000, amount: 0, percent: 0 });
  });

  it('returns null instead of throwing when the stock is not enough', async () => {
    catalog.a = makeProduct('a', '100.00', '110.00', 1);

    await expect(
      getPriceComparison([{ productId: 'a', size: 'M', qty: 3 }])
    ).resolves.toBeNull();
  });

  it('returns null when a product is missing', async () => {
    await expect(
      getPriceComparison([{ productId: 'ghost', size: 'M', qty: 1 }])
    ).resolves.toBeNull();
  });
});
