import type { PriceMethod } from './price-method';

// Pure and client-safe (no DB, no 'use server'): display-only lookup over the
// serialized price rows of a product. The server stays authoritative at checkout.

export type PriceRow = { paymentMethod: string; value: string };

// Throws (instead of falling back to '0.00') when the row is missing, so a
// missing price can never be displayed or summed as if it were free.
export function pickPrice(prices: PriceRow[], priceMethod: PriceMethod): string {
  const row = prices.find((p) => p.paymentMethod === priceMethod);
  if (!row) {
    throw new Error(`No hay precio configurado para el método ${priceMethod}`);
  }
  return row.value;
}
