import { extractDualPrice } from '@/lib/duo-pricing';
import ProductPrice from './product-price';

type MaybePrices = { prices?: { paymentMethod: string; value: string }[] };

/**
 * Muestra el precio dual (efectivo/transferencia destacado, MP al lado).
 * Por default, marca como "destacado" el `priceCash` y como "secundario"
 * el `priceMercadoPago`. El destacado puede cambiarse vía prop `emphasize`.
 */
const DualPrice = ({
  product,
  emphasize = 'CASH',
  className = '',
}: {
  product: MaybePrices;
  emphasize?: 'CASH' | 'MERCADOPAGO';
  className?: string;
}) => {
  const { priceCash, priceMercadoPago } = extractDualPrice(product);
  const cashNum = Number(priceCash);
  const mpNum = Number(priceMercadoPago);

  // Si los dos precios son iguales (o MP es 0), no mostramos la distinción
  if (mpNum === 0 || mpNum === cashNum) {
    return <ProductPrice value={cashNum} className={className} />;
  }

  const primary = emphasize === 'CASH' ? cashNum : mpNum;
  const secondary = emphasize === 'CASH' ? mpNum : cashNum;
  const secondaryLabel = emphasize === 'CASH' ? 'o por MP' : 'o efectivo/transferencia';

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <ProductPrice value={primary} />
      <p className='az-caption text-az-stone'>
        {secondaryLabel}: <span className='line-through'>${secondary.toFixed(2)}</span>
      </p>
    </div>
  );
};

export default DualPrice;
