import ProductCard from '@/components/shared/product/product-card';
import { Button } from '@/components/ui/button';
import { getAllProducts } from '@/lib/actions/product.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import Link from 'next/link';

const prices = [
  {
    name: '$1 to $50',
    value: '1-50',
  },
  {
    name: '$51 to $100',
    value: '51-100',
  },
  {
    name: '$101 to $200',
    value: '101-200',
  },
  {
    name: '$201 to $500',
    value: '201-500',
  },
  {
    name: '$501 to $1000',
    value: '501-1000',
  },
];

const sortOrders = ['newest', 'lowest', 'highest'];

export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string;
    category: string;
    subCategory: string;
    price: string;
  }>;
}) {
  const {
    q = 'all',
    category = 'all',
    subCategory = 'all',
    price = 'all',
  } = await props.searchParams;

  const isQuerySet = q && q !== 'all' && q.trim() !== '';
  const isCategorySet =
    category && category !== 'all' && category.trim() !== '';
  const isSubCategorySet =
    subCategory && subCategory !== 'all' && subCategory.trim() !== '';
  const isPriceSet = price && price !== 'all' && price.trim() !== '';

  if (isQuerySet || isCategorySet || isSubCategorySet || isPriceSet) {
    return {
      title: `
      Search ${isQuerySet ? q : ''}
      ${isCategorySet ? `: Category ${category}` : ''}
      ${isSubCategorySet ? `: Sub-category ${subCategory}` : ''}
      ${isPriceSet ? `: Price ${price}` : ''}`,
    };
  } else {
    return {
      title: 'Search Products',
    };
  }
}

const SearchPage = async (props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    subCategory?: string;
    price?: string;
    sort?: string;
    page?: string;
  }>;
}) => {
  const {
    q = 'all',
    category = 'all',
    subCategory = 'all',
    price = 'all',
    sort = 'newest',
    page = '1',
  } = await props.searchParams;

  // Construct filter url
  const getFilterUrl = ({
    c,
    sc,
    p,
    s,
    pg,
  }: {
    c?: string;
    sc?: string;
    p?: string;
    s?: string;
    pg?: string;
  }) => {
    const params = { q, category, subCategory, price, sort, page };

    if (c) params.category = c;
    if (c && c !== category && !sc) params.subCategory = 'all';
    else if (sc) params.subCategory = sc;

    if (p) params.price = p;
    if (s) params.sort = s;
    if (pg) params.page = pg;

    return `/search?${new URLSearchParams(params).toString()}`;
  };

  const products = await getAllProducts({
    query: q,
    category,
    subCategory,
    price,
    sort,
    page: Number(page),
  });

  const { data: categories = [] } = await getAllCategories();

  return (
    <div className='grid md:grid-cols-5 md:gap-5'>
      <div className='filter-links'>
        {/* Category Links */}
        <div className='text-xl mb-2 mt-3'>Department</div>
        <div>
          <ul className='space-y-1'>
            <li>
              <Link
                className={`${
                  (category === 'all' || category === '') && 'font-bold'
                }`}
                href={getFilterUrl({ c: 'all' })}
              >
                Any
              </Link>
            </li>
            {categories.map((x) => (
              <li key={x.id}>
                <Link
                  className={`${category === x.slug && 'font-bold'}`}
                  href={getFilterUrl({ c: x.slug })}
                >
                  {x.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Price Links */}
        <div className='text-xl mb-2 mt-8'>Price</div>
        <div>
          <ul className='space-y-1'>
            <li>
              <Link
                className={`${price === 'all' && 'font-bold'}`}
                href={getFilterUrl({ p: 'all' })}
              >
                Any
              </Link>
            </li>
            {prices.map((p) => (
              <li key={p.value}>
                <Link
                  className={`${price === p.value && 'font-bold'}`}
                  href={getFilterUrl({ p: p.value })}
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className='md:col-span-4 space-y-4'>
        <div className='flex-between flex-col md:flex-row my-4'>
          <div className='flex items-center flex-wrap gap-2'>
            {q !== 'all' && q !== '' && <span>Query: {q}</span>}
            {category !== 'all' && category !== '' && <span>Category: {category}</span>}
            {subCategory !== 'all' && subCategory !== '' && <span>Sub-category: {subCategory}</span>}
            {price !== 'all' && <span>Price: {price}</span>}

            {(q !== 'all' && q !== '') ||
            (category !== 'all' && category !== '') ||
            (subCategory !== 'all' && subCategory !== '') ||
            price !== 'all' ? (
              <Button variant={'link'} asChild>
                <Link href='/search'>Clear</Link>
              </Button>
            ) : null}
          </div>
          <div>
            Sort by{' '}
            {sortOrders.map((s) => (
              <Link
                key={s}
                className={`mx-2 ${sort == s && 'font-bold'}`}
                href={getFilterUrl({ s })}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {products.data.length === 0 && <div>No products found</div>}
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
