import ProductCard from '@/components/shared/product/product-card';
import { Button } from '@/components/ui/button';
import { getAllProducts } from '@/lib/actions/product.actions';
import { getProductsByBanner } from '@/lib/actions/product.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllColors } from '@/lib/actions/color.actions';
import Link from 'next/link';
import { SlidersHorizontal, X, Tag, ChevronDown } from 'lucide-react';
import { Metadata } from 'next';
import BannerActivator from '@/components/shared/banner-activator';
import SearchPagination from '@/components/shared/search-pagination';
import FiltersDisclosure from '@/components/shared/filters-disclosure';
import { PAGE_SIZE } from '@/lib/constants';

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

// Native <details> accordion: no JS needed, keyboard accessible
const FilterGroup = ({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) => (
  <details open={defaultOpen} className='group border-t border-az-hairline-soft'>
    <summary className='flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden py-4 az-body-sm-bold text-az-ink-deep'>
      {title}
      <ChevronDown className='w-4 h-4 text-az-steel transition-transform duration-150 group-open:rotate-180' />
    </summary>
    <div className='pb-4'>{children}</div>
  </details>
);

// --- Metadata ---
export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string;
    category: string;
    subCategory: string;
    price: string;
    color: string;
    page: string;
    banner: string;
  }>;
}): Promise<Metadata> {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    color = 'all',
    page = '1',
  } = await props.searchParams;

  const parts: string[] = [];
  if (q && q !== 'all') parts.push(q);
  if (category && category !== 'all') parts.push(category);
  if (color && color !== 'all') parts.push(color);
  if (price && price !== 'all') parts.push(`Precio ${price}`);

  const isFiltered =
    (q !== 'all' && q !== '') ||
    (category !== 'all' && category !== '') ||
    (color !== 'all' && color !== '') ||
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
    color?: string;
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
    color = 'all',
    sort = 'newest',
    page = '1',
    banner = '',
  } = await props.searchParams;

  const getFilterUrl = ({
    c, sc, p, col, s, pg,
  }: {
    c?: string; sc?: string; p?: string; col?: string; s?: string; pg?: string;
  }) => {
    // Any filter/sort change resets to page 1; only explicit `pg` moves pages
    const params: Record<string, string> = { q, category, subCategory, price, color, sort, page: '1' };
    if (banner) params.banner = banner;
    if (c) params.category = c;
    if (c && c !== category && !sc) params.subCategory = 'all';
    else if (sc) params.subCategory = sc;
    if (p) params.price = p;
    if (col) params.color = col;
    if (s) params.sort = s;
    if (pg) params.page = pg;
    return `/search?${new URLSearchParams(params).toString()}`;
  };

  // If a banner param is present, load banner products; otherwise use regular search
  let bannerData: Awaited<ReturnType<typeof getProductsByBanner>> | null = null;
  let products: { data: ReturnType<typeof Array<unknown>>; totalPages: number; totalCount: number } = {
    data: [],
    totalPages: 1,
    totalCount: 0,
  };
  const currentPage = Math.max(1, Math.floor(Number(page)) || 1);

  if (banner) {
    bannerData = await getProductsByBanner(banner);
    // Convert banner products into the same shape getAllProducts returns
    const bannerProducts = bannerData?.products ?? [];
    products = {
      data: bannerProducts as unknown[],
      totalPages: 1,
      totalCount: bannerProducts.length,
    };
  } else {
    products = await getAllProducts({
      query: q,
      category,
      subCategory,
      price,
      sort,
      page: currentPage,
      color,
    });
  }

  const { data: categories = [] } = await getAllCategories();
  const colors = await getAllColors();

  const hasActiveFilters =
    (q !== 'all' && q !== '') ||
    (category !== 'all' && category !== '') ||
    (subCategory !== 'all' && subCategory !== '') ||
    (color !== 'all' && color !== '') ||
    price !== 'all' ||
    !!banner;

  const activeFilterLabel = [
    q !== 'all' && q !== '' && `"${q}"`,
    category !== 'all' && category !== '' && category,
    subCategory !== 'all' && subCategory !== '' && subCategory,
    color !== 'all' && color !== '' && color,
    price !== 'all' && price,
    banner && bannerData?.title && `Oferta: ${bannerData.title}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const resultCount = (products.data as unknown[]).length;
  const rangeStart = banner ? 1 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart + resultCount - 1;

  const rowClass = (active: boolean) =>
    `az-body-sm block py-1.5 transition-colors duration-150 ${
      active
        ? 'text-az-ink-deep font-semibold underline underline-offset-4'
        : 'text-az-steel hover:text-az-ink-deep'
    }`;


  return (
    <>
      {/* Sets the activeBanner cookie client-side when banner param is present */}
      {banner && <BannerActivator bannerId={banner} />}

      {/* Breadcrumb */}
      <nav aria-label='Breadcrumb' className='az-caption text-az-stone mb-6'>
        <Link href='/' className='hover:text-az-ink-deep transition-colors'>
          Inicio
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-az-ink-deep'>Productos</span>
      </nav>

      <div className='grid md:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start'>
        {/* ── Filters ── */}
        <aside className='md:sticky md:top-24'>
          <FiltersDisclosure
            footer={
              hasActiveFilters ? (
                <Link href='/search' className='block'>
                  <Button
                    variant='outlineLight'
                    size='sm'
                    className='w-full rounded-az-full gap-1.5'
                  >
                    <X className='w-3.5 h-3.5' />
                    Limpiar filtros
                  </Button>
                </Link>
              ) : null
            }
          >
            <div>
              {/* Categories */}
              {!banner && (
                <FilterGroup title='Categoría' defaultOpen>
                  <ul>
                    <li>
                      <Link
                        href={getFilterUrl({ c: 'all' })}
                        className={rowClass(category === 'all' || category === '')}
                      >
                        Todas
                      </Link>
                    </li>
                    {categories.map((x) => (
                      <li key={x.id}>
                        <Link
                          href={getFilterUrl({ c: x.slug })}
                          className={rowClass(category === x.slug)}
                        >
                          {x.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </FilterGroup>
              )}

              {/* Price — hide when browsing a banner (fixed product set) */}
              {!banner && (
                <FilterGroup title='Precio' defaultOpen={price !== 'all'}>
                  <ul>
                    <li>
                      <Link
                        href={getFilterUrl({ p: 'all' })}
                        className={rowClass(price === 'all')}
                      >
                        Cualquier precio
                      </Link>
                    </li>
                    {prices.map((pr) => (
                      <li key={pr.value}>
                        <Link
                          href={getFilterUrl({ p: pr.value })}
                          className={rowClass(price === pr.value)}
                        >
                          {pr.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </FilterGroup>
              )}

              {/* Color swatches */}
              {colors.length > 0 && (
                <FilterGroup title='Color' defaultOpen={color !== 'all'}>
                  <ul className='flex flex-wrap gap-2.5 p-1'>
                    {colors.map((co: { id: string; name: string; hex: string }) => {
                      const slug = co.name.toLowerCase().replace(/\s+/g, '-');
                      const isActive = color === slug;
                      return (
                        <li key={co.id}>
                          <Link
                            href={getFilterUrl({ col: isActive ? 'all' : slug })}
                            title={co.name}
                            aria-label={`${co.name}${isActive ? ' (quitar filtro)' : ''}`}
                            aria-current={isActive ? 'true' : undefined}
                            className={`block w-7 h-7 rounded-full border border-az-hairline ring-offset-2 transition-shadow ${
                              isActive ? 'ring-2 ring-az-ink-deep' : ''
                            }`}
                            style={{ backgroundColor: co.hex }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </FilterGroup>
              )}

            </div>
          </FiltersDisclosure>
        </aside>

        {/* ── Results ── */}
        <div className='space-y-6'>
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

          {/* Title + count + sort */}
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-3'>
            <div>
              <h1 className='az-heading-md text-az-ink-deep'>
                {hasActiveFilters ? activeFilterLabel : 'Todos los productos'}
              </h1>
              <p className='az-caption text-az-stone mt-1'>
                {resultCount > 0
                  ? `Mostrando ${rangeStart}–${rangeEnd} de ${products.totalCount} producto${products.totalCount !== 1 ? 's' : ''}`
                  : '0 productos'}
              </p>
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
          {resultCount === 0 ? (
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
            <div className='grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(products.data as any[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <SearchPagination
            page={currentPage}
            totalPages={products.totalPages}
            getPageUrl={(pg) => getFilterUrl({ pg: String(pg) })}
          />
        </div>
      </div>
    </>
  );
};

export default SearchPage;
