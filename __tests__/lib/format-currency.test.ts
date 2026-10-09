import { formatCurrency, formatCurrencyParts } from '@/lib/utils';

describe('formatCurrency (Argentine format)', () => {
  it('formats integers with thousands dots and a decimal comma', () => {
    expect(formatCurrency(59990)).toBe('$59.990,00');
  });

  it('accepts numeric strings', () => {
    expect(formatCurrency('54000.00')).toBe('$54.000,00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0,00');
  });

  it('keeps small amounts without grouping', () => {
    expect(formatCurrency(999)).toBe('$999,00');
    expect(formatCurrency(1000)).toBe('$1.000,00');
  });

  it('rounds to 2 decimals and groups millions', () => {
    expect(formatCurrency(1234567.891)).toBe('$1.234.567,89');
  });

  it('rounds half up on the decimal representation', () => {
    expect(formatCurrency(999.995)).toBe('$1.000,00');
    expect(formatCurrency(1.005)).toBe('$1,01');
  });

  it('puts the minus sign before the currency sign', () => {
    expect(formatCurrency(-1234)).toBe('-$1.234,00');
    expect(formatCurrency('-0.5')).toBe('-$0,50');
  });

  it('never renders a negative zero', () => {
    expect(formatCurrency(-0.001)).toBe('$0,00');
  });

  it('returns NaN for null and non-numeric input', () => {
    expect(formatCurrency(null)).toBe('NaN');
    expect(formatCurrency('abc')).toBe('NaN');
    expect(formatCurrency(Infinity)).toBe('NaN');
    expect(formatCurrency(NaN)).toBe('NaN');
  });

  it('treats an empty string as NaN (not as zero)', () => {
    expect(formatCurrency('')).toBe('NaN');
    expect(formatCurrency('   ')).toBe('NaN');
  });
});

describe('formatCurrencyParts', () => {
  it('splits integer (grouped) and decimals', () => {
    expect(formatCurrencyParts(59990)).toEqual({
      sign: '',
      integer: '59.990',
      decimals: '00',
    });
  });

  it('returns null for invalid input', () => {
    expect(formatCurrencyParts('abc')).toBeNull();
  });
});
