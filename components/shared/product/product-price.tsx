import { cn, formatCurrencyParts } from '@/lib/utils';

const ProductPrice = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  // Argentine format: thousands dots, decimal comma, 2 decimals
  const { sign, integer, decimals } = formatCurrencyParts(value) ?? {
    sign: '',
    integer: '0',
    decimals: '00',
  };

  return (
    <p className={cn('text-2xl', className)}>
      {sign}
      <span className='text-xs align-super'>$</span>
      {integer}
      <span className='text-xs align-super'>,{decimals}</span>
    </p>
  );
};

export default ProductPrice;
