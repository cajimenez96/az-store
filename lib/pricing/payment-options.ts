import type { Savings } from './savings';

// Pure helper, safe to import from client components (no prisma, no 'use server').
// It only reshapes totals that the server already quoted.

export type PriceComparisonInput = {
  listTotal: number;
  cashTotal: number;
  amount: number;
  percent: number;
};

export type PaymentOptionTotals = {
  MercadoPago: { total: number };
  TransferenciaBancaria: { total: number; savings: Savings | null };
};

// Product total per web payment method. Savings are null when transferring does not save money.
export function paymentOptionTotals(
  comparison: PriceComparisonInput | null
): PaymentOptionTotals | null {
  if (!comparison) return null;
  const hasSavings = comparison.amount > 0;
  return {
    MercadoPago: { total: comparison.listTotal },
    TransferenciaBancaria: {
      total: comparison.cashTotal,
      savings: hasSavings ? { amount: comparison.amount, percent: comparison.percent } : null,
    },
  };
}
