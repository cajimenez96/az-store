import { Badge } from '@/components/ui/badge';
import { getProductBySlug } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import ProductImages from '@/components/shared/product/product-images';
import AddToCart from '@/components/shared/product/add-to-cart';
import { getMyCart } from '@/lib/actions/cart.actions';
import ReviewList from './review-list';
import { auth } from '@/auth';
import Rating from '@/components/shared/product/rating';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const cart = await getMyCart();

  const price = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(Number(product.price));

  return (
    <div className='bg-canvas-night min-h-screen pt-24'>
      {/* ─── Product Hero ─────────────────────────────────────────── */}
      <section className='wrapper py-16 md:py-24'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-start'>
          {/* Image gallery */}
          <div className='rounded-2xl overflow-hidden bg-canvas-night-elevated border border-hairline-dark'>
            <ProductImages images={product.images} />
          </div>

          {/* Product details */}
          <div className='flex flex-col gap-8 lg:sticky lg:top-28'>
            {/* Eyebrow */}
            <div>
              <p className='eyebrow-cap text-link-cool-1 mb-4'>
                {product.brand} — {product.category}
              </p>
              <h1 className='display-lg text-white mb-6 leading-tight'>
                {product.name}
              </h1>

              {/* Rating row */}
              <div className='flex items-center gap-3'>
                <Rating value={Number(product.rating)} />
                <span className='text-shade-40 text-sm'>
                  {product.numReviews} {product.numReviews === 1 ? 'opinión' : 'opiniones'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className='border-t border-hairline-dark pt-8'>
              <p className='eyebrow-cap text-shade-50 mb-2'>Precio</p>
              <p className='display-md text-white'>{price}</p>
            </div>

            {/* Stock status */}
            <div className='flex items-center gap-3'>
              {product.stock > 0 ? (
                <>
                  <Badge className='bg-aloe-10/10 text-aloe-10 border border-aloe-10/20 rounded-pill px-4 py-1 text-xs font-medium'>
                    Con stock
                  </Badge>
                  <span className='text-shade-40 text-sm'>
                    {product.stock} disponibles
                  </span>
                </>
              ) : (
                <Badge className='bg-red-500/10 text-red-400 border border-red-500/20 rounded-pill px-4 py-1 text-xs font-medium'>
                  Sin stock
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className='border-t border-hairline-dark pt-8'>
              <p className='eyebrow-cap text-shade-50 mb-3'>Descripción</p>
              <p className='text-shade-30 text-base leading-relaxed'>
                {product.description}
              </p>
            </div>

            {/* CTA */}
            <div className='border-t border-hairline-dark pt-8 flex flex-col sm:flex-row gap-3'>
              {product.stock > 0 ? (
                <div className='w-full'>
                  <AddToCart
                    cart={cart}
                    item={{
                      productId: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      qty: 1,
                      image: product.images![0],
                    }}
                  />
                </div>
              ) : (
                <Button
                  variant='outlineOnDark'
                  disabled
                  className='rounded-pill w-full opacity-40 cursor-not-allowed'
                >
                  Sin stock
                </Button>
              )}
              <Button asChild variant='ghost' className='rounded-pill text-white/60 hover:text-white hover:bg-white/10'>
                <Link href='/search'>← Ver más</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Reviews ──────────────────────────────────────────────── */}
      <section className='bg-canvas-night-elevated border-t border-hairline-dark'>
        <div className='wrapper py-16'>
          <p className='eyebrow-cap text-link-cool-1 mb-4'>Comunidad</p>
          <h2 className='display-md text-white mb-10'>
            Opiniones de los clientes
          </h2>
          <ReviewList
            userId={userId || ''}
            productId={product.id}
            productSlug={product.slug}
          />
        </div>
      </section>
    </div>
  );
};

export default ProductDetailsPage;
