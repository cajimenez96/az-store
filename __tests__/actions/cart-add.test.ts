/**
 * AZ-001 — addItemToCart must not trust client data.
 * Only productId / size / productColorId are read from the payload; name, slug,
 * image, price, payment method and qty come from the database.
 */

jest.mock('@/lib/actions/settings.actions', () => ({ getShippingSettings: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: () => ({ value: 'session-1' }),
    set: jest.fn(),
  })),
}));
jest.mock('@/auth', () => ({ auth: jest.fn(async () => null) }));
jest.mock('@/db/prisma', () => ({
  prisma: {
    product: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    cart: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

import { prisma } from '@/db/prisma';
import { addItemToCart } from '@/lib/actions/cart.actions';
import type { CartItem } from '@/types';

const productFindFirst = prisma.product.findFirst as jest.Mock;
const cartFindFirst = prisma.cart.findFirst as jest.Mock;
const cartCreate = prisma.cart.create as jest.Mock;
const cartUpdate = prisma.cart.update as jest.Mock;

const STOCK = 2;

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
    variants: [{ id: 'v-m', stock: STOCK, colorId: null, size: { name: 'M' }, productColor: null }],
    ...overrides,
  };
}

/** The forged payload a malicious client could send. */
const forged = {
  productId: 'prod-1',
  size: 'M',
  qty: 500,
  priceUsed: '0.01',
  name: 'Hacked',
  slug: 'hacked',
  image: '/evil.png',
  paymentMethod: 'MERCADOPAGO',
  colorName: 'Rojo',
  colorHex: '#ff0000',
};

let storedCart: Record<string, unknown> | null;

beforeEach(() => {
  storedCart = null;
  productFindFirst.mockReset().mockResolvedValue(makeProduct());
  (prisma.user.findFirst as jest.Mock).mockReset().mockResolvedValue(null);
  cartFindFirst.mockReset().mockImplementation(async () => storedCart);
  cartCreate.mockReset().mockImplementation(async ({ data }) => {
    storedCart = { id: 'cart-1', ...data };
  });
  cartUpdate.mockReset().mockImplementation(async ({ data }) => {
    storedCart = { ...storedCart, ...data };
  });
});

const storedItems = () => (storedCart?.items ?? []) as CartItem[];

describe('addItemToCart — server-side resolution', () => {
  it('ignores forged price, name, slug, image, payment method and qty', async () => {
    const result = await addItemToCart(forged as unknown as CartItem);

    expect(result.success).toBe(true);
    expect(storedItems()).toEqual([
      {
        productId: 'prod-1',
        name: 'Remera Oversize',
        slug: 'remera-oversize',
        image: '/img/base.jpg',
        size: 'M',
        qty: 1,
        priceUsed: '110.00',
        paymentMethod: 'MERCADOPAGO',
      },
    ]);
    // The cart stores the LIST (MERCADOPAGO) price, never the CASH one.
    expect(storedItems()[0].priceUsed).not.toBe('100.00');
    expect(Number(storedCart?.itemsPrice)).toBe(110);
  });

  it('increments by exactly 1 when the item is already in the cart', async () => {
    await addItemToCart(forged as unknown as CartItem);
    const result = await addItemToCart({ ...forged, qty: 500 } as unknown as CartItem);

    expect(result.success).toBe(true);
    expect(storedItems()).toHaveLength(1);
    expect(storedItems()[0].qty).toBe(2);
    expect(Number(storedCart?.itemsPrice)).toBe(220);
  });

  it('fails with a stock error at the variant stock limit and leaves the cart untouched', async () => {
    await addItemToCart(forged as unknown as CartItem);
    await addItemToCart(forged as unknown as CartItem);
    const result = await addItemToCart(forged as unknown as CartItem);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/No hay suficiente stock/);
    expect(storedItems()[0].qty).toBe(STOCK);
  });

  it('re-prices an existing cart line from the database when adding again', async () => {
    storedCart = {
      id: 'cart-1',
      itemsPrice: '0.01',
      totalPrice: '0.01',
      shippingPrice: '0',
      taxPrice: '0',
      items: [
        {
          productId: 'prod-1',
          name: 'Tampered',
          slug: 'tampered',
          image: '/x.png',
          size: 'M',
          qty: 1,
          priceUsed: '0.01',
          paymentMethod: 'CASH',
        },
      ],
    };
    await addItemToCart({ productId: 'prod-1', size: 'M' });

    expect(storedItems()[0]).toMatchObject({ name: 'Remera Oversize', priceUsed: '110.00', qty: 2 });
  });

  it('returns an error for an unknown variant', async () => {
    const result = await addItemToCart({ ...forged, size: 'XXL' } as unknown as CartItem);

    expect(result).toEqual({ success: false, message: 'Variante (talle/color) no encontrada' });
    expect(cartCreate).not.toHaveBeenCalled();
    expect(cartUpdate).not.toHaveBeenCalled();
  });

  it('returns an error for an inactive product', async () => {
    productFindFirst.mockResolvedValue(makeProduct({ isActive: false }));
    const result = await addItemToCart(forged as unknown as CartItem);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no está disponible/);
    expect(cartCreate).not.toHaveBeenCalled();
  });

  it('rejects a payload without productId', async () => {
    const result = await addItemToCart({ size: 'M' } as unknown as CartItem);

    expect(result.success).toBe(false);
    expect(cartCreate).not.toHaveBeenCalled();
  });
});
