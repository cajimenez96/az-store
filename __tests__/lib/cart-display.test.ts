/**
 * The cart page must show the CURRENT list price from the database, not the
 * price stored when the item was added (older carts hold the transfer price,
 * and admins can change prices at any time).
 */

import { withListPrices } from '@/lib/pricing/cart-display';

const baseCart = {
  id: 'cart-1',
  items: [
    { productId: 'p1', name: 'Polo', qty: 2, priceUsed: '54000', paymentMethod: 'CASH' as const },
    { productId: 'p2', name: 'Hoodie', qty: 1, priceUsed: '90000', paymentMethod: 'CASH' as const },
  ],
  itemsPrice: '198000.00',
  taxPrice: '0.00',
  shippingPrice: '0.00',
  totalPrice: '198000.00',
};

const quote = {
  lines: [
    { productId: 'p1', priceUsed: '59990.00', paymentMethod: 'MERCADOPAGO' as const },
    { productId: 'p2', priceUsed: '99990.00', paymentMethod: 'MERCADOPAGO' as const },
  ],
  itemsPrice: 219970,
};

describe('withListPrices', () => {
  const original = process.env.TAX_RATE;

  afterEach(() => {
    if (original === undefined) delete process.env.TAX_RATE;
    else process.env.TAX_RATE = original;
  });

  it('replaces every item price with the quoted list price, keeping the rest', () => {
    const result = withListPrices(baseCart, quote);

    expect(result.items.map((i) => i.priceUsed)).toEqual(['59990.00', '99990.00']);
    expect(result.items.map((i) => i.paymentMethod)).toEqual(['MERCADOPAGO', 'MERCADOPAGO']);
    expect(result.items.map((i) => i.qty)).toEqual([2, 1]);
    expect(result.id).toBe('cart-1');
  });

  it('recomputes items and total prices from the quote', () => {
    const result = withListPrices(baseCart, quote);

    expect(result.itemsPrice).toBe('219970.00');
    expect(result.totalPrice).toBe('219970.00');
  });

  it('adds tax and shipping to the total when they apply', () => {
    process.env.TAX_RATE = '0.1';

    const result = withListPrices({ ...baseCart, shippingPrice: '500.00' }, quote);

    expect(result.totalPrice).toBe('242467.00'); // 219970 + 21997 + 500
  });

  it('does not mutate the original cart', () => {
    withListPrices(baseCart, quote);

    expect(baseCart.items[0].priceUsed).toBe('54000');
    expect(baseCart.itemsPrice).toBe('198000.00');
  });
});
