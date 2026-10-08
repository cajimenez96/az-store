/**
 * AZ-001 — tax is computed on the server-quoted items price, shared by the
 * cart and by createOrder.
 */

import { calcTax } from '@/lib/pricing/totals';

describe('calcTax', () => {
  const original = process.env.TAX_RATE;

  afterEach(() => {
    if (original === undefined) delete process.env.TAX_RATE;
    else process.env.TAX_RATE = original;
  });

  it('is 0 when TAX_RATE is not set', () => {
    delete process.env.TAX_RATE;

    expect(calcTax(1000)).toBe(0);
  });

  it('applies TAX_RATE to the items price, rounded to 2 decimals', () => {
    process.env.TAX_RATE = '0.21';

    expect(calcTax(100)).toBe(21);
    expect(calcTax(33.33)).toBe(7);
  });
});
