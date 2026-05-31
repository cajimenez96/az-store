import ProductCard from '@/components/shared/product/product-card';
import { Button } from '@/components/ui/button';
import { getAllProducts } from '@/lib/actions/product.actions';
import { getProductsByBanner } from '@/lib/actions/product.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import Link from 'next/link';
import { SlidersHorizontal, X, Tag } from 'lucide-react';
import { Metadata } from 'next';
import BannerActivator from '@/components/shared/banner-activator';

// --- Price ranges (ARS) ---
const prices = [
  { name: 'Hasta $5.000',    value: '1-5000' },
  { name: '$5.001 – $15.000', value: '5001-15000' },
  { name: '$15.001 – $30.000', value: '15001-30000' },
  { name: '$30.001 – $60.000', value: '30001-60000' },
  { name: 'Más de $60.000', value: '60001-999999' },
];

const sortLabels: Record<string, string> = {
  newest: 'Más Nuevos',
  lowest: 'Menor Precio',
  highest: 'Mayor Precio',
};

const sortOrders = ['newest', 'lowest', 'highest'];

// --- Metadata ---
export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string;
    category: string;
    subCategory: string;
    price: string;
    page: string;
    banner: string;
  }>;
}): Promise<Metadata> {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    page = '1',
  } = await props.searchParams;

  const parts: string[] = [];
  if (q && q !== 'all') parts.push(q);
  if (category && category !== 'all') parts.push(category);
  if (price && price !== 'all') parts.push(`Precio ${price}`);

  const isFiltered =
    (q !== 'all' && q !== '') ||
    (category !== 'all' && category !== '') ||
    (price !== 'all' && price !== '') ||
    Number(page) > 1;

  return {
    title: parts.length > 0 ? `Búsqueda: ${parts.join(' · ')}` : 'Catálogo de Productos',
    description: 'Buscá y filtrá productos por categoría, precio y más.',
    robots: isFiltered ? { index: false, follow: true } : undefined,
  };
}

// --- Page ---
const SearchPage = async (props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    subCategory?: string;
    price?: string;
    sort?: string;
    page?: string;
    banner?: string;
  }>;
}) => {
  const {
    q = 'all',
    category = 'all',
    subCategory = 'all',
    price = 'all',
    sort = 'newest',
    page = '1',
    banner = '',
  } = await props.searchParams;

  const getFilterUrl = ({
    c, sc, p, s, pg,
  }: {
    c?: string; sc?: string; p?: string; s?: string; pg?: string;
  }) => {
    const params: Record<string, string> = { q, category, subCategory, price, sort, page };
    if (banner) params.banner = banner;
    if (c) params.category = c;
    if (c && c !== category && !sc) params.subCategory = 'all';
    else if (sc) params.subCategory = sc;
    if (p) params.price = p;
    if (s) params.sort = s;
    if (pg) params.page = pg;
    return `/search?${new URLSearchParams(params).toString()}`;
  };

  // If a banner param is present, load banner products; otherwise use regular search
  let bannerData: Awaited<ReturnType<typeof getProductsByBanner>> | null = null;
  let products: { data: ReturnType<typeof Array<unknown>>; totalPages: number } = { data: [], totalPages: 1 };

  if (banner) {
    bannerData = await getProductsByBanner(banner);
    // Convert banner products into the same shape getAllProducts returns
    const bannerProducts = bannerData?.products ?? [];
    products = {
      data: bannerProducts as unknown[],
      totalPages: 1,
    };
  } else {
    products = await getAllProducts({
      query: q,
      category,
      subCategory,
      price,
      sort,
      page: Number(page),
    });
  }

  const { data: categories = [] } = await getAllCategories();

  const hasActiveFilters =
    (q !== 'all' && q !== '') ||
    (category !== 'all' && category !== '') ||
    (subCategory !== 'all' && subCategory !== '') ||
    price !== 'all' ||
    !!banner;

  const activeFilterLabel = [
    q !== 'all' && q !== '' && `"${q}"`,
    category !== 'all' && category !== '' && category,
    subCategory !== 'all' && subCategory !== '' && subCategory,
    price !== 'all' && price,
    banner && bannerData?.title && `Oferta: ${bannerData.title}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      {/* Sets the activeBanner cookie client-side when banner param is present */}
      {banner && <BannerActivator bannerId={banner} />}

      <div className='grid md:grid-cols-[220px_1fr] gap-8 items-start'>
        {/* ── Sidebar filters ── */}
        <aside className='bg-az-canvas rounded-az-xl border border-az-hairline-soft p-5 space-y-7 md:sticky md:top-24'>
          <div className='flex items-center gap-2 border-b border-az-hairline-soft pb-4'>
            <SlidersHorizontal className='w-4 h-4 text-az-steel' />
            <h2 className='az-body-sm-bold text-az-ink-deep'>Filtros</h2>
          </div>

          {/* Categories */}
          {!banner && (
            <div className='space-y-3'>
              <p className='az-caption-bold text-az-stone uppercase tracking-wider'>Categoría</p>
              <ul className='space-y-1'>
                <li>
                  <Link
                    href={getFilterUrl({ c: 'all' })}
                    className={`az-body-sm block px-3 py-1.5 rounded-az-lg transition-colors duration-150 ${
                      category === 'all' || category === ''
                        ? 'bg-az-primary text-white font-semibold'
                        : 'text-az-charcoal hover:bg-az-surface-soft'
                    }`}
                  >
                    Todas
                  </Link>
                </li>
                {categories.map((x) => (
                  <li key={x.id}>
                    <Link
                      href={getFilterUrl({ c: x.slug })}
                      className={`az-body-sm block px-3 py-1.5 rounded-az-lg transition-colors duration-150 ${
                        category === x.slug
                          ? 'bg-az-primary text-white font-semibold'
                          : 'text-az-charcoal hover:bg-az-surface-soft'
                      }`}
                    >
                      {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price — hide when browsing a banner (fixed product set) */}
          {!banner && (
            <div className='space-y-3'>
              <p className='az-caption-bold text-az-stone uppercase tracking-wider'>Precio</p>
              <ul className='space-y-1'>
                <li>
                  <Link
                    href={getFilterUrl({ p: 'all' })}
                    className={`az-body-sm block px-3 py-1.5 rounded-az-lg transition-colors duration-150 ${
                      price === 'all'
                        ? 'bg-az-primary text-white font-semibold'
                        : 'text-az-charcoal hover:bg-az-surface-soft'
                    }`}
                  >
                    Cualquier precio
                  </Link>
                </li>
                {prices.map((pr) => (
                  <li key={pr.value}>
                    <Link
                      href={getFilterUrl({ p: pr.value })}
                      className={`az-body-sm block px-3 py-1.5 rounded-az-lg transition-colors duration-150 ${
                        price === pr.value
                          ? 'bg-az-primary text-white font-semibold'
                          : 'text-az-charcoal hover:bg-az-surface-soft'
                      }`}
                    >
                      {pr.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clear all */}
          {hasActiveFilters && (
            <Link href='/search'>
              <Button
                variant='outlineLight'
                size='sm'
                className='w-full rounded-az-full gap-1.5'
              >
                <X className='w-3.5 h-3.5' />
                Limpiar filtros
              </Button>
            </Link>
          )}
        </aside>

        {/* ── Results ── */}
        <div className='space-y-5'>
          {/* Banner promo notice */}
          {banner && bannerData && (
            <div className='flex items-center gap-3 bg-az-primary/10 border border-az-primary/20 rounded-az-xl px-5 py-4'>
              <Tag className='w-5 h-5 text-az-primary flex-shrink-0' />
              <div>
                <p className='az-body-sm-bold text-az-primary'>{bannerData.title}</p>
                {bannerData.discountPercent && (
                  <p className='az-caption text-az-primary/80'>
                    {bannerData.discountPercent}% de descuento al confirmar la compra
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Top bar: active filters + sort */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
            <div className='flex items-center flex-wrap gap-2'>
              {hasActiveFilters ? (
                <>
                  <span className='az-body-sm text-az-steel'>Resultados para:</span>
                  <span className='az-body-sm-bold text-az-ink-deep'>{activeFilterLabel}</span>
                  <Link href='/search'>
                    <button className='inline-flex items-center gap-1 az-caption text-az-stone hover:text-az-critical transition-colors'>
                      <X className='w-3 h-3' />
                      Limpiar
                    </button>
                  </Link>
                </>
              ) : (
                <span className='az-heading-sm text-az-ink-deep'>Todos los productos</span>
              )}
              <span className='az-caption text-az-stone'>
                ({(products.data as unknown[]).length} resultado{(products.data as unknown[]).length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Sort — hide when browsing a banner */}
            {!banner && (
              <div className='flex items-center gap-2 flex-shrink-0'>
                <span className='az-caption text-az-stone'>Ordenar:</span>
                <div className='flex gap-1'>
                  {sortOrders.map((s) => (
                    <Link
                      key={s}
                      href={getFilterUrl({ s })}
                      className={`az-caption-bold px-3 py-1.5 rounded-az-full transition-colors duration-150 ${
                        sort === s
                          ? 'bg-az-ink-deep text-white'
                          : 'bg-az-surface-soft text-az-charcoal hover:bg-az-hairline-soft'
                      }`}
                    >
                      {sortLabels[s]}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product grid */}
          {(products.data as unknown[]).length === 0 ? (
            <div className='flex flex-col items-center justify-center py-24 text-center'>
              <div className='w-16 h-16 rounded-az-xxxl bg-az-surface-soft flex items-center justify-center mb-4'>
                <SlidersHorizontal className='w-7 h-7 text-az-stone' />
              </div>
              <p className='az-body-md-bold text-az-ink-deep mb-1'>Sin resultados</p>
              <p className='az-body-sm text-az-steel mb-6'>
                No encontramos productos con los filtros seleccionados.
              </p>
              <Link href='/search'>
                <Button variant='buyCta' size='sm' className='rounded-az-full'>
                  Ver todos los productos
                </Button>
              </Link>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(products.data as any[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
