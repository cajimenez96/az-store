import { pickPrice } from '@/lib/pricing/price-lookup';

const prices = [
  { paymentMethod: 'CASH', value: '100.00' },
  { paymentMethod: 'MERCADOPAGO', value: '120.00' },
];

describe('pickPrice', () => {
  it('returns the CASH value string', () => {
    expect(pickPrice(prices, 'CASH')).toBe('100.00');
  });

  it('returns the MERCADOPAGO value string', () => {
    expect(pickPrice(prices, 'MERCADOPAGO')).toBe('120.00');
  });

  it('throws a clear error when the requested price row is missing', () => {
    expect(() => pickPrice([prices[0]], 'MERCADOPAGO')).toThrow(
      'No hay precio configurado para el método MERCADOPAGO'
    );
  });

  it('throws when there are no prices at all', () => {
    expect(() => pickPrice([], 'CASH')).toThrow(
      'No hay precio configurado para el método CASH'
    );
  });
});
