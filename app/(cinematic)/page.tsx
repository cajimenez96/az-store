import {
  getLatestProducts,
  getFeaturedProducts,
} from '@/lib/actions/product.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import ProductCarouselDark from '@/components/shared/product/product-carousel-dark';
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
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();
  const categoriesResult = await getAllCategories();
  const categories = categoriesResult.data || [];

  return (
    <>
      {/* Band 1: Hero full-bleed carousel */}
      <ProductCarouselDark data={featuredProducts} />

      {/* Band 2: Category grid (only render if categories exist) */}
      {categories.length > 0 && (
        <section className='bg-az-canvas py-az-section-sm'>
          <div className='az-wrapper'>
            <div className='flex items-end justify-between mb-8'>
              <h2 className='az-heading-md text-az-ink-deep'>
                Explorar por categoría
              </h2>
              <Link
                href='/search'
                className='az-body-sm text-az-steel hover:text-az-ink-deep transition-colors duration-150'
              >
                Ver todo →
              </Link>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
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
                      className='group flex flex-col items-center gap-3 p-4 bg-az-surface-soft rounded-az-xl hover:bg-az-canvas hover:shadow-az-sticky transition-all duration-200 border border-transparent hover:border-az-hairline-soft'
                    >
                      <div className='w-16 h-16 rounded-az-full bg-az-canvas flex items-center justify-center overflow-hidden'>
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            width={64}
                            height={64}
                            className='object-cover w-full h-full'
                          />
                        ) : (
                          <span className='az-heading-sm text-az-steel'>
                            {cat.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className='az-body-sm-bold text-az-ink text-center group-hover:text-az-ink-deep transition-colors duration-150'>
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
        <section className='bg-az-canvas py-az-section'>
          <div className='az-wrapper'>
            <div className='flex items-end justify-between mb-10'>
              <div>
                <p className='az-caption-bold text-az-steel uppercase tracking-widest mb-2'>
                  Colección
                </p>
                <h2 className='az-heading-lg text-az-ink-deep'>Destacados</h2>
              </div>
              <Link
                href='/search?isFeatured=true'
                className='hidden md:flex items-center gap-1 az-body-sm-bold text-az-ink-deep border-2 border-az-ink-deep px-6 py-3 rounded-az-full hover:bg-az-ink-deep hover:text-az-canvas transition-colors duration-150'
              >
                Ver todos
              </Link>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Band 4: Promo strip (dark) */}
      <section className='py-az-section-sm px-8'>
        <div className='az-wrapper'>
          <div className='bg-az-ink-deep dark:bg-[#0a1317] rounded-az-xxxl px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-8 border'>
            <div>
              <p className='az-caption-bold text-az-stone dark:text-[#8595a4] uppercase tracking-widest mb-3'>
                Envíos
              </p>
              <h2 className='az-heading-md text-white mb-2'>
                Comprá con confianza
              </h2>
              <p className='az-body-md text-az-stone dark:text-[#8595a4] max-w-md'>
                Envíos a todo el país · Pagá en cuotas · Atención personalizada
              </p>
            </div>
            <Link
              href='/search'
              className='shrink-0 az-button-md bg-white text-az-ink-deep dark:text-[#0a1317] px-8 py-4 rounded-az-full hover:bg-az-surface-soft dark:hover:bg-white/90 transition-colors duration-150'
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Band 5: Latest products */}
      {latestProducts.length > 0 && (
        <section className='bg-az-canvas py-az-section'>
          <div className='az-wrapper'>
            <div className='flex items-end justify-between mb-10'>
              <div>
                <p className='az-caption-bold text-az-steel uppercase tracking-widest mb-2'>
                  Novedades
                </p>
                <h2 className='az-heading-lg text-az-ink-deep'>
                  Recién llegados
                </h2>
              </div>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {latestProducts.slice(0, 4).map((product) => (
                <ProductCardDark key={product.slug} product={product} />
              ))}
            </div>
            <div className='flex justify-center mt-12'>
              <Link
                href='/search'
                className='az-button-md bg-az-ink-button text-white px-10 py-4 rounded-az-full hover:bg-az-charcoal transition-colors duration-150'
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
