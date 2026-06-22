import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import DualPrice from './dual-price';

type ProductCardData = {
  slug: string;
  images: string[];
  name: string;
  brand?: { name: string } | null;
  stock?: number;
  variants?: { stock: number }[];
  hasColorVariants?: boolean;
  colors?: { color?: { name: string; hex: string } | null }[];
  // Fase 2: el producto trae un array de precios (uno por método de pago).
  prices?: { paymentMethod: string; value: string }[];
};

const ProductCard = ({ product }: { product: ProductCardData }) => {
  const stock =
    product.stock ||
    (product.variants as { stock: number }[] | undefined)?.reduce(
      (acc, v) => acc + v.stock,
      0
    ) ||
    0;

  const productColors = product.colors ?? [];
  const showColorSwatches =
    product.hasColorVariants && productColors.length > 0;

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='p-0 items-center relative'>
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images[0]}
            alt={product.name}
            height={300}
            width={300}
            priority={true}
          />
        </Link>
        {showColorSwatches && (
          <div className='absolute bottom-2 left-2 flex items-center gap-1 bg-az-canvas/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm'>
            {productColors.slice(0, 5).map((pc, i) =>
              pc.color ? (
                <span
                  key={`${pc.color.name}-${i}`}
                  className='inline-block w-3 h-3 rounded-full border border-az-hairline'
                  style={{ backgroundColor: pc.color.hex }}
                  title={pc.color.name}
                />
              ) : null
            )}
            {productColors.length > 5 && (
              <span className='az-caption text-az-stone ml-1'>
                +{productColors.length - 5}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className='p-4 grid gap-4'>
        <div className='text-xs'>
          {product.brand
            ? typeof product.brand === 'string'
              ? product.brand
              : product.brand.name
            : ''}
        </div>
        <Link href={`/product/${product.slug}`}>
          <h2 className='text-sm font-medium'>{product.name}</h2>
        </Link>
        {showColorSwatches && (
          <p className='az-caption text-az-stone'>
            {productColors.length}{' '}
            {productColors.length === 1 ? 'color disponible' : 'colores disponibles'}
          </p>
        )}
        <div className='flex-between gap-4'>
          {stock > 0 ? (
            <DualPrice product={product} />
          ) : (
            <p className='text-destructive'>Sin stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
