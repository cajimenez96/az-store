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

function toPriceString(value: string | undefined): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

/**
 * Inverso de `extractDualPrice`: arma el array `prices` a partir de los valores
 * crudos del form de admin, para que el card de vista previa los lea igual que
 * un producto guardado. Los valores vacíos o inválidos quedan en '0.00'.
 */
export function buildPriceRows(values: {
  priceCash?: string;
  priceMercadoPago?: string;
}): { paymentMethod: 'CASH' | 'MERCADOPAGO'; value: string }[] {
  return [
    { paymentMethod: 'CASH', value: toPriceString(values.priceCash) },
    { paymentMethod: 'MERCADOPAGO', value: toPriceString(values.priceMercadoPago) },
  ];
}
