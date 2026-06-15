/**
 * Utilidades puras para dual pricing. No contiene `'use server'` así que
 * puede importarse desde client components (cards, PDP, etc.).
 */

import { PaymentMethod as InternalPaymentMethod } from '@/lib/constants';

type PriceRow = { paymentMethod: string; value: string | { toString(): string } };

/**
 * A partir de un producto (con `prices` ya cargado), devuelve un objeto
 * `{ priceCash, priceMercadoPago }` con strings de 2 decimales, listo
 * para mapear al form de admin, al card de storefront o al input de search.
 */
export function extractDualPrice(product: {
  prices?: PriceRow[];
}): { priceCash: string; priceMercadoPago: string } {
  const map: Record<InternalPaymentMethod, string> = {
    CASH: '0.00',
    MERCADOPAGO: '0.00',
  };
  for (const p of product.prices ?? []) {
    if (p.paymentMethod === 'CASH' || p.paymentMethod === 'MERCADOPAGO') {
      map[p.paymentMethod as InternalPaymentMethod] =
        typeof p.value === 'string' ? p.value : p.value.toString();
    }
  }
  return { priceCash: map.CASH, priceMercadoPago: map.MERCADOPAGO };
}
