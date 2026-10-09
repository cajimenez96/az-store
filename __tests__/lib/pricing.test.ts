/**
 * AZ-001 — server-side price/quantity resolution.
 * The server derives name, slug, image, price and stock from the database;
 * nothing the client sends (other than ids, size, color and qty) is trusted.
 */

jest.mock('@/db/prisma', () => ({
  prisma: {
    product: { findFirst: jest.fn() },
  },
}));

import { prisma } from '@/db/prisma';
import { priceMethodFor } from '@/lib/pricing/price-method';
import { resolveLine, quoteItems, InsufficientStockError } from '@/lib/pricing/quote';

const findFirst = prisma.product.findFirst as jest.Mock;

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    name: 'Remera Oversize',
    slug: 'remera-oversize',
    images: ['/img/base.jpg'],
    isActive: true,
    hasColorVariants: false,
    prices: [
      { paymentMethod: 'CASH', value: '100.00' },
      { paymentMethod: 'MERCADOPAGO', value: '110.00' },
    ],
    variants: [
      { id: 'v-m', stock: 5, colorId: null, size: { name: 'M' }, productColor: null },
      { id: 'v-l', stock: 0, colorId: null, size: { name: 'L' }, productColor: null },
    ],
    ...overrides,
  };
}

describe('priceMethodFor', () => {
  it.each([
    ['web', 'TransferenciaBancaria', 'CASH'],
    ['web', 'MercadoPago', 'MERCADOPAGO'],
    ['pos', 'PuntoDeVenta_Efectivo', 'CASH'],
    ['pos', 'PuntoDeVenta_Transferencia', 'CASH'],
    ['pos', 'PuntoDeVenta_MercadoPago', 'MERCADOPAGO'],
    ['pos', 'PuntoDeVenta_QR', 'MERCADOPAGO'],
  ] as const)('%s / %s -> %s', (source, method, expected) => {
    expect(priceMethodFor(source, method)).toBe(expected);
  });

  it('rejects an unknown method', () => {
    expect(() => priceMethodFor('web', 'Bitcoin')).toThrow(/método de pago/i);
  });

  it('rejects a POS method on the web source and vice versa', () => {
    expect(() => priceMethodFor('web', 'PuntoDeVenta_Efectivo')).toThrow();
    expect(() => priceMethodFor('pos', 'MercadoPago')).toThrow();
  });
});

describe('resolveLine', () => {
  beforeEach(() => {
    findFirst.mockReset();
    findFirst.mockResolvedValue(makeProduct());
  });

  it('takes name, slug, image and price from the database', async () => {
    const line = await resolveLine({ productId: 'prod-1', size: 'M', qty: 1 }, 'CASH');

    expect(line).toMatchObject({
      productId: 'prod-1',
      name: 'Remera Oversize',
      slug: 'remera-oversize',
      image: '/img/base.jpg',
      size: 'M',
      qty: 1,
      priceUsed: '100.00',
      paymentMethod: 'CASH',
    });
  });

  it('uses the MercadoPago price when that method is requested', async () => {
    const line = await resolveLine({ productId: 'prod-1', size: 'M', qty: 1 }, 'MERCADOPAGO');

    expect(line.priceUsed).toBe('110.00');
    expect(line.paymentMethod).toBe('MERCADOPAGO');
  });

  it('fails with a clear message when the product does not exist', async () => {
    findFirst.mockResolvedValue(null);

    await expect(resolveLine({ productId: 'nope', size: 'M', qty: 1 }, 'CASH')).rejects.toThrow(
      'Producto no encontrado'
    );
  });

  it('rejects an inactive product', async () => {
    findFirst.mockResolvedValue(makeProduct({ isActive: false }));

    await expect(resolveLine({ productId: 'prod-1', size: 'M', qty: 1 }, 'CASH')).rejects.toThrow(
      'Este producto no está disponible actualmente'
    );
  });

  it('fails when the size does not exist for the product', async () => {
    await expect(resolveLine({ productId: 'prod-1', size: 'XXL', qty: 1 }, 'CASH')).rejects.toThrow(
      'Variante (talle/color) no encontrada'
    );
  });

  it('fails when qty exceeds the stock of the exact variant', async () => {
    await expect(resolveLine({ productId: 'prod-1', size: 'M', qty: 6 }, 'CASH')).rejects.toThrow(
      /No hay suficiente stock/
    );
  });

  it('fails when the variant has no stock at all', async () => {
    await expect(resolveLine({ productId: 'prod-1', size: 'L', qty: 1 }, 'CASH')).rejects.toThrow(
      /No hay suficiente stock/
    );
  });

  it('fails when there is no price configured for the method', async () => {
    findFirst.mockResolvedValue(
      makeProduct({ prices: [{ paymentMethod: 'CASH', value: '100.00' }] })
    );

    await expect(
      resolveLine({ productId: 'prod-1', size: 'M', qty: 1 }, 'MERCADOPAGO')
    ).rejects.toThrow(/No hay precio configurado/);
  });

  it('resolves products with color variants by size AND color', async () => {
    findFirst.mockResolvedValue(
      makeProduct({
        hasColorVariants: true,
        variants: [
          {
            id: 'v-m-red',
            stock: 2,
            colorId: 'pc-red',
            size: { name: 'M' },
            productColor: { id: 'pc-red', images: ['/img/red.jpg'], color: { name: 'Rojo', hex: '#f00' } },
          },
          {
            id: 'v-m-blue',
            stock: 9,
            colorId: 'pc-blue',
            size: { name: 'M' },
            productColor: { id: 'pc-blue', images: ['/img/blue.jpg'], color: { name: 'Azul', hex: '#00f' } },
          },
        ],
      })
    );

    const line = await resolveLine(
      { productId: 'prod-1', size: 'M', productColorId: 'pc-red', qty: 2 },
      'CASH'
    );

    expect(line).toMatchObject({
      productColorId: 'pc-red',
      colorName: 'Rojo',
      colorHex: '#f00',
      image: '/img/red.jpg',
    });
    // 3 would fit the blue variant (9) but not the red one (2): stock is per exact variant.
    await expect(
      resolveLine({ productId: 'prod-1', size: 'M', productColorId: 'pc-red', qty: 3 }, 'CASH')
    ).rejects.toThrow(/No hay suficiente stock/);
  });

  it('requires a color when the product has color variants', async () => {
    findFirst.mockResolvedValue(
      makeProduct({
        hasColorVariants: true,
        variants: [
          {
            id: 'v-m-red',
            stock: 2,
            colorId: 'pc-red',
            size: { name: 'M' },
            productColor: { id: 'pc-red', images: ['/img/red.jpg'], color: { name: 'Rojo', hex: '#f00' } },
          },
        ],
      })
    );

    await expect(resolveLine({ productId: 'prod-1', size: 'M', qty: 1 }, 'CASH')).rejects.toThrow(
      'Variante (talle/color) no encontrada'
    );
  });

  it('supports the auto-created "Único" size', async () => {
    findFirst.mockResolvedValue(
      makeProduct({
        variants: [{ id: 'v-u', stock: 3, colorId: null, size: { name: 'Único' }, productColor: null }],
      })
    );

    const line = await resolveLine({ productId: 'prod-1', size: 'Único', qty: 1 }, 'CASH');

    expect(line.size).toBe('Único');
  });
});

describe('quoteItems', () => {
  beforeEach(() => {
    findFirst.mockReset();
    findFirst.mockResolvedValue(makeProduct());
  });

  it('sums price * qty from database prices, rounded to 2 decimals', async () => {
    const quote = await quoteItems([{ productId: 'prod-1', size: 'M', qty: 3 }], 'MERCADOPAGO');

    expect(quote.lines).toHaveLength(1);
    expect(quote.itemsPrice).toBe(330);
  });

  it('returns the id of the variant it validated for each line, in line order', async () => {
    findFirst.mockResolvedValue(
      makeProduct({
        variants: [
          { id: 'v-m', stock: 5, colorId: null, size: { name: 'M' }, productColor: null },
          { id: 'v-l', stock: 4, colorId: null, size: { name: 'L' }, productColor: null },
        ],
      })
    );

    const quote = await quoteItems(
      [
        { productId: 'prod-1', size: 'L', qty: 1 },
        { productId: 'prod-1', size: 'M', qty: 2 },
      ],
      'CASH'
    );

    expect(quote.variantIds).toEqual(['v-l', 'v-m']);
  });

  it('checks stock against the combined qty of lines hitting the same variant', async () => {
    // Variant M has stock 5: each line fits alone (3 <= 5) but 3 + 3 oversells it.
    await expect(
      quoteItems(
        [
          { productId: 'prod-1', size: 'M', qty: 3 },
          { productId: 'prod-1', size: 'M', qty: 3 },
        ],
        'CASH'
      )
    ).rejects.toThrow(/No hay suficiente stock/);
  });

  it('keeps each line qty when combined lines still fit the stock', async () => {
    const quote = await quoteItems(
      [
        { productId: 'prod-1', size: 'M', qty: 2 },
        { productId: 'prod-1', size: 'M', qty: 3 },
      ],
      'CASH'
    );

    expect(quote.lines.map((l) => l.qty)).toEqual([2, 3]);
    expect(quote.itemsPrice).toBe(500);
  });

  it('propagates a line error and quotes nothing', async () => {
    await expect(
      quoteItems(
        [
          { productId: 'prod-1', size: 'M', qty: 1 },
          { productId: 'prod-1', size: 'L', qty: 1 },
        ],
        'CASH'
      )
    ).rejects.toThrow(/No hay suficiente stock/);
  });
});

describe('InsufficientStockError', () => {
  beforeEach(() => {
    findFirst.mockReset();
    findFirst.mockResolvedValue(makeProduct());
  });

  it('carries the available stock of the exact variant', async () => {
    const error = await resolveLine({ productId: 'prod-1', size: 'M', qty: 6 }, 'CASH').catch(
      (e) => e
    );
    expect(error).toBeInstanceOf(InsufficientStockError);
    expect(error.available).toBe(5);
    expect(error.message).toMatch(/^No hay suficiente stock/);
  });

  it('reports zero available for an out-of-stock variant', async () => {
    const error = await resolveLine({ productId: 'prod-1', size: 'L', qty: 1 }, 'CASH').catch(
      (e) => e
    );
    expect(error).toBeInstanceOf(InsufficientStockError);
    expect(error.available).toBe(0);
  });

  it.each([0, -2, 1.5])('is NOT thrown for an invalid qty (%s), so callers never clamp it up to the stock', async (qty) => {
    const error = await resolveLine({ productId: 'prod-1', size: 'M', qty }, 'CASH').catch(
      (e) => e
    );
    expect(error).not.toBeInstanceOf(InsufficientStockError);
    expect(error.message).toBe('Cantidad no válida');
  });

  it('is not used for other failures', async () => {
    const error = await resolveLine({ productId: 'prod-1', size: 'XXL', qty: 1 }, 'CASH').catch(
      (e) => e
    );
    expect(error).not.toBeInstanceOf(InsufficientStockError);
  });
});
