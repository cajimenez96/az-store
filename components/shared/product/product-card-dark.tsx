import Link from 'next/link';
import Image from 'next/image';
import Rating from './rating';
import ProductPrice from './product-price';

const ProductCardDark = ({ product }: { product: { slug: string; images: string[]; name: string; brand: string; rating: string | number; price: string | number; variants?: { stock: number }[] } }) => {
  const stock = (product.variants as { stock: number }[] | undefined)?.reduce((acc, v) => acc + v.stock, 0) || 0;
  return (
    <Link href={`/product/${product.slug}`} className='group block'>
      <div className='bg-canvas-night-elevated rounded-xl overflow-hidden shadow-level-2-dark border border-hairline-dark hover:border-white/20 transition-all duration-300 hover:-translate-y-1'>
        {/* Image container */}
        <div className='relative aspect-square overflow-hidden bg-canvas-night'>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className='object-cover object-center group-hover:scale-105 transition-transform duration-500'
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
          />
          {stock === 0 && (
            <div className='absolute inset-0 bg-black/60 flex items-center justify-center'>
              <span className='text-white/70 text-sm font-medium tracking-widest uppercase'>Sin stock</span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className='p-4 space-y-2'>
          <p className='eyebrow-cap text-link-cool-2'>{product.brand}</p>
          <h3 className='text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-aloe-10 transition-colors duration-200'>
            {product.name}
          </h3>
          <div className='flex items-center justify-between pt-1'>
            <Rating value={Number(product.rating)} />
            {stock > 0 ? (
              <ProductPrice
                value={Number(product.price)}
                className='text-white font-semibold text-sm'
              />
            ) : (
              <span className='text-shade-50 text-xs'>Sin stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCardDark;
