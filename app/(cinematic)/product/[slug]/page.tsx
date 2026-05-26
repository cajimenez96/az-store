import { getProductBySlug } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import ProductImages from '@/components/shared/product/product-images';
import { getMyCart } from '@/lib/actions/cart.actions';
import ProductAction from '@/components/shared/product/product-action';
import Link from 'next/link';

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const cart = await getMyCart();

  const price = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(Number(product.price));

  return (
    <div className='bg-az-canvas min-h-screen'>
      <div className='az-wrapper py-8 md:py-12'>
        {/* Breadcrumb */}
        <nav className='flex items-center gap-2 az-body-sm text-az-stone mb-8'>
          <Link href='/' className='hover:text-az-ink transition-colors duration-150'>
            Inicio
          </Link>
          <span>›</span>
          <Link href='/search' className='hover:text-az-ink transition-colors duration-150'>
            Productos
          </Link>
          <span>›</span>
          <Link
            href={`/search?category=${product.category.slug}`}
            className='hover:text-az-ink transition-colors duration-150'
          >
            {product.category.name}
          </Link>
          <span>›</span>
          <span className='text-az-ink az-body-sm'>{product.name}</span>
        </nav>

        {/* Product grid: gallery + purchase rail */}
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-start'>
          {/* Gallery */}
          <ProductImages images={product.images} />

          {/* Purchase rail — sticky on desktop */}
          <div className='lg:sticky lg:top-24'>
            <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft shadow-az-sticky p-8'>
              {/* Brand + category eyebrow */}
              <p className='az-caption text-az-steel mb-3'>
                {product.brand?.name}
                {product.category?.name ? ` · ${product.category.name}` : ''}
                {product.subCategory?.name ? ` · ${product.subCategory.name}` : ''}
              </p>

              {/* Product name */}
              <h1 className='az-heading-sm text-az-ink-deep mb-6 leading-snug'>
                {product.name}
              </h1>

              {/* Price */}
              <div className='mb-6'>
                <p className='az-caption text-az-stone mb-1'>Precio</p>
                <p className='az-display-lg text-az-ink-deep'>{price}</p>
              </div>

              {/* Size selector + CTA */}
              <ProductAction product={product} cart={cart} />

              {/* Description */}
              <div className='border-t border-az-hairline-soft mt-8 pt-6'>
                <p className='az-caption-bold text-az-steel uppercase tracking-widest mb-3'>
                  Descripción
                </p>
                <p className='az-body-sm text-az-charcoal leading-relaxed'>
                  {product.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding on mobile to account for sticky bar */}
      <div className='h-20 md:hidden' />
    </div>
  );
};

export default ProductDetailsPage;
