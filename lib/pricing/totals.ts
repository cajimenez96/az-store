import { round2 } from '@/lib/utils';

// Deliberately NOT a 'use server' module: shared by cart and order actions.

// Tax is a flat TAX_RATE (env) applied on the items price.
export function calcTax(itemsPrice: number): number {
  const taxRate = parseFloat(process.env.TAX_RATE ?? '0');
  return round2(taxRate * itemsPrice);
}
