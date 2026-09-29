import {
  getLatestProducts,
  getFeaturedProducts,
} from '@/lib/actions/product.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getActivePromoBanners } from '@/lib/actions/promo-banner.actions';
import ProductCarouselDark from '@/components/shared/product/product-carousel-dark';
import PromoBannerCarousel from '@/components/shared/promo-banner-carousel';
import ProductCardDark from '@/components/shared/product/product-card-dark';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { APP_NAME, APP_DESCRIPTION, SERVER_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: SERVER_URL,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/opengraph-image.png'],
  },
};

export default async function Homepage() {
  const [latestProducts, featuredProducts, categoriesResult, activePromoBanners] =
    await Promise.all([
      getLatestProducts(),
      getFeaturedProducts(),
      getAllCategories(),
      getActivePromoBanners(),
    ]);
  const categories = categoriesResult.data || [];

  return (
    <>
      {/* Band 1: Hero full-bleed carousel — promo banners take priority, fallback to products */}
      {activePromoBanners.length > 0 ? (
        <PromoBannerCarousel banners={activePromoBanners} />
      ) : (
        <ProductCarouselDark data={featuredProducts} />
      )}

      {/* Band 2: Category grid (only render if categories exist) */}
      {categories.length > 0 && (
        <section className='bg-white py-12 md:py-16 border-b border-nike-hairline-soft'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-end justify-between mb-8'>
              <h2 className='font-nike-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-nike-ink'>
                Explorar por categoría
              </h2>
              <Link
                href='/search'
                className='font-sans text-sm font-medium text-nike-mute hover:text-nike-ink underline underline-offset-4 transition-colors'
              >
                Ver todo
              </Link>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4'>
              {categories
                .slice(0, 10)
                .map(
                  (cat: {
                    id: string;
                    slug: string;
                    name: string;
                    image?: string | null;
                  }) => (
                    <Link
                      key={cat.id}
                      href={`/search?category=${cat.slug}`}
                      className='group flex flex-col items-center gap-3 p-4 bg-nike-soft-cloud hover:bg-[#ececec] transition-colors rounded-none'
                    >
                      <div className='w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm'>
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            width={64}
                            height={64}
                            className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-200'
                          />
                        ) : (
                          <span className='font-nike-display text-xl text-nike-ink'>
                            {cat.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className='font-sans text-sm font-medium text-nike-ink text-center'>
                        {cat.name}
                      </span>
                    </Link>
                  )
                )}
            </div>
          </div>
        </section>
      )}

      {/* Band 3: Featured products */}
      {featuredProducts.length > 0 && (
        <section className='bg-white py-12 md:py-16 border-b border-nike-hairline-soft'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-end justify-between mb-8'>
              <div>
                <p className='font-sans text-xs sm:text-sm font-semibold text-nike-mute uppercase tracking-widest mb-1'>
                  Colección
                </p>
                <h2 className='font-nike-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-nike-ink'>
                  Destacados
                </h2>
              </div>
              <Link
                href='/search?isFeatured=true'
                className='hidden md:inline-flex items-center font-sans text-sm font-medium text-nike-ink border border-nike-ink px-6 py-2.5 rounded-full hover:bg-nike-ink hover:text-white active:scale-95 transition-all'
              >
                Ver todos
              </Link>
            </div>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Band 4: Promo strip (dark editorial) */}
      <section className='py-12 md:py-16 bg-white'>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-nike-ink text-white p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8'>
            <div>
              <p className='font-sans text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-widest mb-2'>
                Envíos a todo el país
              </p>
              <h2 className='font-nike-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white mb-2'>
                Comprá con total confianza
              </h2>
              <p className='font-sans text-sm sm:text-base text-white/80 max-w-xl font-normal leading-relaxed'>
                Pagá con Mercado Pago o transferencia bancaria · Seguimiento en tiempo real · Atención personalizada
              </p>
            </div>
            <Link
              href='/search'
              className='shrink-0 inline-flex items-center justify-center bg-white text-nike-ink px-8 py-3.5 rounded-full text-sm font-medium hover:bg-nike-soft-cloud active:scale-95 transition-all shadow-sm'
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Band 5: Latest products */}
      {latestProducts.length > 0 && (
        <section className='bg-white py-12 md:py-16'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-end justify-between mb-8'>
              <div>
                <p className='font-sans text-xs sm:text-sm font-semibold text-nike-mute uppercase tracking-widest mb-1'>
                  Novedades
                </p>
                <h2 className='font-nike-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-nike-ink'>
                  Recién llegados
                </h2>
              </div>
            </div>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
              {latestProducts.slice(0, 8).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
            <div className='flex justify-center mt-12'>
              <Link
                href='/search'
                className='inline-flex items-center justify-center bg-nike-ink text-white px-10 py-3.5 rounded-full text-sm font-medium hover:bg-black/80 active:scale-95 transition-all'
              >
                Ver todos los productos
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
