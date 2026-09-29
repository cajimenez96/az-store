import Link from 'next/link';
import Image from 'next/image';
import DualPrice from './dual-price';

type ProductCardData = {
  slug: string;
  images: string[];
  name: string;
  brand?: string | { name: string } | null;
  stock?: number;
  variants?: { stock: number }[];
  hasColorVariants?: boolean;
  colors?: { color?: { name: string; hex: string } | null }[];
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

  const brandName = product.brand
    ? typeof product.brand === 'string'
      ? product.brand
      : product.brand.name
    : '';

  return (
    <Link href={`/product/${product.slug}`} className='group block w-full'>
      {/* 1:1 Product Image Stage */}
      <div className='relative aspect-square bg-nike-soft-cloud overflow-hidden flex items-center justify-center'>
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className='object-contain object-center p-4 group-hover:scale-105 transition-transform duration-300'
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
        />
        {stock === 0 && (
          <div className='absolute top-3 left-3'>
            <span className='bg-nike-ink text-white font-sans text-[11px] font-medium px-2.5 py-1 rounded-full tracking-wide uppercase'>
              Agotado
            </span>
          </div>
        )}
        {showColorSwatches && (
          <div className='absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm'>
            {productColors.slice(0, 4).map((pc, i) =>
              pc.color ? (
                <span
                  key={`${pc.color.name}-${i}`}
                  className='inline-block w-2.5 h-2.5 rounded-full border border-nike-hairline'
                  style={{ backgroundColor: pc.color.hex }}
                  title={pc.color.name}
                />
              ) : null
            )}
            {productColors.length > 4 && (
              <span className='font-sans text-[11px] text-nike-mute font-medium'>
                +{productColors.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className='pt-3 pb-1'>
        {brandName && (
          <p className='font-sans text-xs sm:text-sm font-normal text-nike-mute mb-0.5 tracking-normal'>
            {brandName}
          </p>
        )}
        <h3 className='font-sans text-sm sm:text-base font-medium text-nike-ink leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity'>
          {product.name}
        </h3>
        {showColorSwatches && (
          <p className='font-sans text-xs text-nike-mute mt-0.5'>
            {productColors.length}{' '}
            {productColors.length === 1 ? 'color' : 'colores'}
          </p>
        )}
        <div className='mt-1.5'>
          {stock > 0 ? (
            <DualPrice product={product} className='font-sans text-sm sm:text-base font-medium text-nike-ink' />
          ) : (
            <span className='font-sans text-xs sm:text-sm text-nike-mute font-normal'>Agotado temporalmente</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
