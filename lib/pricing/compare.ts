import { quoteItems, type QuoteInput } from './quote';
import { computeSavings } from './savings';

// Deliberately NOT a 'use server' module: callers are server components/actions
// that pass ids and qty only; amounts always come from the database.

export type PriceComparison = {
  listTotal: number;
  cashTotal: number;
  amount: number;
  percent: number;
};

// Quotes the same cart with both price lists. It feeds informational UI, so any
// failure (stock, inactive product, missing price...) yields null instead of throwing.
export async function getPriceComparison(inputs: QuoteInput[]): Promise<PriceComparison | null> {
  try {
    const list = await quoteItems(inputs, 'MERCADOPAGO');
    const cash = await quoteItems(inputs, 'CASH');
    return {
      listTotal: list.itemsPrice,
      cashTotal: cash.itemsPrice,
      ...computeSavings(list.itemsPrice, cash.itemsPrice),
    };
  } catch {
    return null;
  }
}
