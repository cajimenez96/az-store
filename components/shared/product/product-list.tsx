import ProductCard from './product-card';
import { Product } from '@/types';

const ProductList = ({
  data,
  title,
  limit,
}: {
  data: Product[];
  title?: string;
  limit?: number;
}) => {
  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className='my-8 sm:my-12'>
      {title && (
        <h2 className='font-nike-display text-3xl sm:text-4xl uppercase tracking-tight text-nike-ink mb-6'>
          {title}
        </h2>
      )}
      {data.length > 0 ? (
        <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
          {limitedData.map((product: Product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className='py-12 text-center'>
          <p className='font-sans text-sm text-nike-mute'>No se encontraron productos</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
