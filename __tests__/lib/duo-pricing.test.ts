import { buildPriceRows, extractDualPrice } from '@/lib/duo-pricing';

describe('buildPriceRows', () => {
  it('builds rows that extractDualPrice reads back as both prices', () => {
    const rows = buildPriceRows({ priceCash: '32000', priceMercadoPago: '35200.5' });

    expect(extractDualPrice({ prices: rows })).toEqual({
      priceCash: '32000.00',
      priceMercadoPago: '35200.50',
    });
  });

  it('falls back to 0.00 for empty form values', () => {
    const rows = buildPriceRows({ priceCash: '', priceMercadoPago: undefined });

    expect(extractDualPrice({ prices: rows })).toEqual({
      priceCash: '0.00',
      priceMercadoPago: '0.00',
    });
  });

  it('falls back to 0.00 for values that are not numbers', () => {
    const rows = buildPriceRows({ priceCash: '12abc', priceMercadoPago: '-' });

    expect(extractDualPrice({ prices: rows })).toEqual({
      priceCash: '0.00',
      priceMercadoPago: '0.00',
    });
  });

  it('updates when the typed value changes', () => {
    const first = buildPriceRows({ priceCash: '100', priceMercadoPago: '110' });
    const second = buildPriceRows({ priceCash: '200', priceMercadoPago: '220' });

    expect(extractDualPrice({ prices: first }).priceCash).toBe('100.00');
    expect(extractDualPrice({ prices: second }).priceCash).toBe('200.00');
  });
});
