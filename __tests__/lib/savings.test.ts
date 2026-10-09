import { computeSavings } from '@/lib/pricing/savings';

describe('computeSavings', () => {
  it.each([
    [59990, 54000, { amount: 5990, percent: 10 }],
    [39950, 36000, { amount: 3950, percent: 10 }],
    [85900, 77000, { amount: 8900, percent: 10 }],
  ])('list %d vs cash %d', (list, cash, expected) => {
    expect(computeSavings(list, cash)).toEqual(expected);
  });

  it('computes the percent from the cart totals of a mixed cart', () => {
    // 59990 + 39950 = 99940 list; 54000 + 36000 = 90000 cash -> 9940 (9.946 %)
    expect(computeSavings(99940, 90000)).toEqual({ amount: 9940, percent: 10 });
  });

  it('rounds the amount to 2 decimals', () => {
    expect(computeSavings(100.555, 90).amount).toBe(10.56);
  });

  it('returns 0 when the totals are equal', () => {
    expect(computeSavings(1000, 1000)).toEqual({ amount: 0, percent: 0 });
  });

  it('never returns a negative saving when cash is higher than list', () => {
    expect(computeSavings(1000, 1200)).toEqual({ amount: 0, percent: 0 });
  });

  it.each([
    [0, 0],
    [0, 100],
    [-10, -20],
    [NaN, 100],
    [100, NaN],
    [Infinity, 100],
    [100, Infinity],
  ])('returns 0 for invalid input (%p, %p)', (list, cash) => {
    expect(computeSavings(list, cash)).toEqual({ amount: 0, percent: 0 });
  });

  it('rounds the percent to a whole number at the .5 boundary', () => {
    expect(computeSavings(10000, 9051).percent).toBe(9); // 9.49 %
    expect(computeSavings(10000, 9050).percent).toBe(10); // 9.5 %
  });
});
