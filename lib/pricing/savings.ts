import { round2 } from '@/lib/utils';

// Pure helper, safe to import from client components (no prisma, no 'use server').
// The totals it receives must come from the server; this only does the arithmetic.

export type Savings = { amount: number; percent: number };

// Savings of paying by cash/transfer instead of the list price, computed from the
// two cart totals. The percent is rounded to a whole number and is never a constant.
export function computeSavings(listTotal: number, cashTotal: number): Savings {
  const none: Savings = { amount: 0, percent: 0 };
  if (!Number.isFinite(listTotal) || !Number.isFinite(cashTotal)) return none;
  if (listTotal <= 0 || cashTotal >= listTotal) return none;

  const amount = round2(listTotal - cashTotal);
  if (amount <= 0) return none;
  return { amount, percent: Math.round((amount / listTotal) * 100) };
}
