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

type HomeCategory = {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
};

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className='text-center mb-8 md:mb-10'>
      {eyebrow && (
        <p className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest mb-1'>
          {eyebrow}
        </p>
      )}
      <h2 className='font-nike-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-nike-ink'>
        {title}
      </h2>
    </div>
  );
}

function ViewAllButton({ href, label }: { href: string; label: string }) {
  return (
    <div className='flex justify-center mt-10'>
      <Link
        href={href}
        className='inline-flex items-center justify-center font-sans text-sm font-medium text-nike-ink border border-nike-hairline px-10 py-3 rounded-full active:scale-95 transition-transform'
      >
        {label}
      </Link>
    </div>
  );
}

export default async function Homepage() {
  const [latestProducts, featuredProducts, categoriesResult, activePromoBanners] =
    await Promise.all([
      getLatestProducts(),
      getFeaturedProducts(),
      getAllCategories(),
      getActivePromoBanners(),
    ]);
  const categories: HomeCategory[] = categoriesResult.data || [];

  return (
    <>
      {/* Hero: promo banners take priority, fallback to products */}
      {activePromoBanners.length > 0 ? (
        <PromoBannerCarousel banners={activePromoBanners} />
      ) : (
        <ProductCarouselDark data={featuredProducts} />
      )}

      {/* Latest products */}
      {latestProducts.length > 0 && (
        <section className='bg-white py-12 md:py-16'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
            <SectionHeading eyebrow='Novedades' title='Recién llegados' />
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
              {latestProducts.slice(0, 4).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
            <ViewAllButton href='/search' label='Ver todos' />
          </div>
        </section>
      )}

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className='bg-white py-12 md:py-16'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
            <SectionHeading eyebrow='Colección' title='Destacados' />
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
            <ViewAllButton href='/search?isFeatured=true' label='Ver todos' />
          </div>
        </section>
      )}

      {/* Categories: compact filter-chip pills */}
      {categories.length > 0 && (
        <section className='bg-white py-12 md:py-16'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
            <SectionHeading title='Explorar por categoría' />
            <div className='flex flex-wrap justify-center gap-2 sm:gap-3'>
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug}`}
                  className='inline-flex items-center gap-2 bg-white text-nike-ink border border-nike-hairline rounded-full pl-1.5 pr-4 py-1.5 font-sans text-sm font-medium active:scale-95 transition-transform'
                >
                  <span className='relative w-8 h-8 rounded-full bg-nike-soft-cloud overflow-hidden flex items-center justify-center shrink-0'>
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt=''
                        fill
                        className='object-cover'
                        sizes='32px'
                      />
                    ) : (
                      <span aria-hidden className='text-xs font-semibold text-nike-mute'>
                        {cat.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust strip: the single solid-ink block on the page */}
      <section className='py-12 md:py-16 bg-white'>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-nike-ink text-white p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8'>
            <div>
              <p className='font-sans text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-widest mb-2'>
                Envíos a todo el país
              </p>
              <h2 className='font-nike-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-white mb-2'>
                Comprá con total confianza
              </h2>
              <p className='font-sans text-sm sm:text-base text-white/80 max-w-xl font-normal leading-relaxed'>
                Pagá con Mercado Pago o transferencia bancaria · Seguimiento en tiempo real · Atención personalizada
              </p>
            </div>
            <Link
              href='/search'
              className='shrink-0 inline-flex items-center justify-center bg-white text-nike-ink px-8 py-3.5 rounded-full text-sm font-medium active:scale-95 transition-transform'
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
