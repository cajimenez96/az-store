import {
  getLatestProducts,
  getFeaturedProducts,
} from '@/lib/actions/product.actions';
import ProductCarouselDark from '@/components/shared/product/product-carousel-dark';
import ProductCardDark from '@/components/shared/product/product-card-dark';
import DealCountdownDark from '@/components/deal-countdown-dark';
import IconBoxesDark from '@/components/icon-boxes-dark';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Homepage() {
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      {/* ─── Banda 1: Hero Full-Bleed ─────────────────────────── */}
      <ProductCarouselDark data={featuredProducts} />

      {/* ─── Banda 2: Productos Destacados ─────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className='bg-canvas-night-elevated section-cinematic'>
          <div className='wrapper'>
            {/* Section header */}
            <div className='flex items-end justify-between mb-12'>
              <div>
                <p className='eyebrow-cap text-link-cool-1 mb-3'>Colección</p>
                <h2 className='display-md text-white'>Destacados</h2>
              </div>
              <Button asChild variant='outlineOnDark' className='hidden md:flex rounded-pill px-6'>
                <Link href='/search'>Ver todos</Link>
              </Button>
            </div>
            {/* Product grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Banda 3: Value Props / Icon Boxes ─────────────────── */}
      <IconBoxesDark />

      {/* ─── Banda 4: Nuevos Productos ─────────────────────────── */}
      {latestProducts.length > 0 && (
        <section className='bg-canvas-night section-cinematic'>
          <div className='wrapper'>
            <div className='flex items-end justify-between mb-12'>
              <div>
                <p className='eyebrow-cap text-link-cool-1 mb-3'>Novedades</p>
                <h2 className='display-md text-white'>Recién llegados</h2>
              </div>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {latestProducts.slice(0, 4).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
            {/* CTA */}
            <div className='flex justify-center mt-12'>
              <Button asChild variant='outlineOnDark' className='rounded-pill px-10 py-3'>
                <Link href='/search'>Ver todos los productos</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ─── Banda 5: Deal Countdown ────────────────────────────── */}
      <DealCountdownDark />
    </>
  );
}
