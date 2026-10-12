import { paymentOptionTotals } from '@/lib/pricing/payment-options';

describe('paymentOptionTotals', () => {
  it('returns null when there is no comparison', () => {
    expect(paymentOptionTotals(null)).toBeNull();
  });

  it('maps list total to MercadoPago and cash total + savings to transfer', () => {
    expect(
      paymentOptionTotals({ listTotal: 59990, cashTotal: 54000, amount: 5990, percent: 10 })
    ).toEqual({
      MercadoPago: { total: 59990 },
      TransferenciaBancaria: { total: 54000, savings: { amount: 5990, percent: 10 } },
    });
  });

  it('sets savings to null when there is no saving', () => {
    const result = paymentOptionTotals({ listTotal: 100, cashTotal: 100, amount: 0, percent: 0 });
    expect(result?.TransferenciaBancaria).toEqual({ total: 100, savings: null });
    expect(result?.MercadoPago).toEqual({ total: 100 });
  });

  it('never exposes negative savings', () => {
    const result = paymentOptionTotals({ listTotal: 100, cashTotal: 120, amount: -20, percent: -20 });
    expect(result?.TransferenciaBancaria.savings).toBeNull();
  });
});
