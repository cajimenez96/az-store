import Link from 'next/link';
import Image from 'next/image';
import DualPrice from './dual-price';

const ProductCardDark = ({
  product,
}: {
  product: {
    slug: string;
    images: string[];
    name: string;
    brand?: string | { name: string } | null;
    variants?: { stock: number }[];
    prices?: { paymentMethod: string; value: string }[];
  };
}) => {
  const stock = (product.variants as { stock: number }[] | undefined)?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const brandName = product.brand
    ? (typeof product.brand === 'string' ? product.brand : product.brand.name)
    : '';

  return (
    <Link href={`/product/${product.slug}`} className='group block'>
      <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft overflow-hidden hover:shadow-az-sticky hover:-translate-y-1 transition-all duration-200'>
        {/* Image area */}
        <div className='relative aspect-square bg-az-surface-soft p-4'>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className='object-contain group-hover:scale-[1.03] transition-transform duration-300 p-4'
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
          />
          {stock === 0 && (
            <div className='absolute top-3 left-3'>
              <span className='az-caption-bold bg-az-critical text-white px-3 py-1 rounded-az-full'>
                Sin stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className='px-6 py-5'>
          {brandName && (
            <p className='az-caption text-az-steel mb-1'>{brandName}</p>
          )}
          <h3 className='az-body-sm-bold text-az-ink mb-3 line-clamp-2 group-hover:text-az-ink-deep transition-colors duration-150'>
            {product.name}
          </h3>
          {stock > 0 ? (
            <DualPrice product={product} className='az-body-md-bold text-az-ink-deep' />
          ) : (
            <span className='az-caption text-az-stone'>Sin stock</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCardDark;
