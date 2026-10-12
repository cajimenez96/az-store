import { extractDualPrice } from '@/lib/duo-pricing';
import { cn, formatCurrency } from '@/lib/utils';
import ProductPrice from './product-price';

type MaybePrices = { prices?: { paymentMethod: string; value: string }[] };

/**
 * Pill that sells the cash/transfer benefit. Flat soft-cloud surface with the
 * success green text (DESIGN.md: pill geometry + soft-cloud + success).
 */
export const CashPricePill = ({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex w-fit max-w-full flex-wrap items-center gap-x-1 rounded-nike-lg bg-nike-soft-cloud px-2 py-0.5 font-sans text-xs font-medium leading-tight text-nike-success',
      className
    )}
  >
    <span>Transferencia o efectivo:</span>
    <span className='font-semibold'>{formatCurrency(amount)}</span>
  </span>
);

/**
 * Shows the dual price: the LIST price (MercadoPago) is the main price and the
 * cash/transfer price is always visible as an emphasized pill. The main price
 * never changes. `emphasize` can still flip which price is the main one.
 */
const DualPrice = ({
  product,
  emphasize = 'MERCADOPAGO',
  className = '',
}: {
  product: MaybePrices;
  emphasize?: 'CASH' | 'MERCADOPAGO';
  className?: string;
}) => {
  const { priceCash, priceMercadoPago } = extractDualPrice(product);
  const cashNum = Number(priceCash);
  const mpNum = Number(priceMercadoPago);

  // If both prices are equal (or MP is 0), do not show the distinction
  if (mpNum === 0 || mpNum === cashNum) {
    return <ProductPrice value={cashNum} className={className} />;
  }

  if (emphasize === 'CASH') {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <ProductPrice value={cashNum} />
        <p className='az-caption text-az-stone'>
          Lista: <span>{formatCurrency(mpNum)}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <ProductPrice value={mpNum} />
      <CashPricePill amount={cashNum} />
    </div>
  );
};

export default DualPrice;
