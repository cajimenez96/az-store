import { round2 } from '@/lib/utils';
import { calcTax } from './totals';
import type { QuoteLine } from './quote';

// Pure helper: safe to call from server components. The cart row only decides
// WHAT and HOW MANY; every displayed price comes from a fresh server quote
// (older carts store the transfer price and admins can change prices at any time).

type PricedItem = { priceUsed: string; paymentMethod: string };
type CartLike<I extends PricedItem> = {
  items: I[];
  itemsPrice: string;
  shippingPrice: string;
  totalPrice: string;
};

export function withListPrices<I extends PricedItem, C extends CartLike<I>>(
  cart: C,
  quote: { lines: Pick<QuoteLine, 'priceUsed' | 'paymentMethod'>[]; itemsPrice: number }
): C {
  const items = cart.items.map((item, index) => ({
    ...item,
    priceUsed: quote.lines[index].priceUsed,
    paymentMethod: quote.lines[index].paymentMethod,
  }));
  const itemsPrice = quote.itemsPrice;
  const totalPrice = round2(itemsPrice + calcTax(itemsPrice) + Number(cart.shippingPrice));

  return {
    ...cart,
    items,
    itemsPrice: itemsPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
}
