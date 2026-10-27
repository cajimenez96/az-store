import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SearchPaginationProps = {
  page: number;
  totalPages: number;
  getPageUrl: (page: number) => string;
};

// Returns page numbers with null as an ellipsis gap, e.g. [1, null, 4, 5, 6, null, 12]
const getPageItems = (page: number, totalPages: number): (number | null)[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: (number | null)[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push(null);
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 1) items.push(null);
  items.push(totalPages);
  return items;
};

const baseControl =
  'inline-flex items-center justify-center h-10 min-w-10 rounded-az-full az-body-sm-bold transition-colors duration-150';

const SearchPagination = ({ page, totalPages, getPageUrl }: SearchPaginationProps) => {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      aria-label='Paginación de productos'
      className='flex items-center justify-center gap-2 pt-6'
    >
      {prevDisabled ? (
        <span
          aria-disabled='true'
          className={`${baseControl} bg-az-surface-soft text-az-stone opacity-50`}
        >
          <ChevronLeft className='w-4 h-4' />
        </span>
      ) : (
        <Link
          href={getPageUrl(page - 1)}
          aria-label='Página anterior'
          rel='prev'
          className={`${baseControl} bg-az-surface-soft text-az-ink-deep hover:bg-az-hairline-soft`}
        >
          <ChevronLeft className='w-4 h-4' />
        </Link>
      )}

      {/* Compact indicator on mobile, numbered pages from sm up */}
      <span className='sm:hidden az-body-sm text-az-charcoal px-2'>
        Página {page} de {totalPages}
      </span>
      <ul className='hidden sm:flex items-center gap-2'>
        {getPageItems(page, totalPages).map((item, idx) =>
          item === null ? (
            <li key={`gap-${idx}`} className='az-body-sm text-az-stone px-1' aria-hidden>
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={getPageUrl(item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={`${baseControl} px-3 ${
                  item === page
                    ? 'bg-az-ink-deep text-white'
                    : 'bg-az-surface-soft text-az-charcoal hover:bg-az-hairline-soft'
                }`}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>

      {nextDisabled ? (
        <span
          aria-disabled='true'
          className={`${baseControl} bg-az-surface-soft text-az-stone opacity-50`}
        >
          <ChevronRight className='w-4 h-4' />
        </span>
      ) : (
        <Link
          href={getPageUrl(page + 1)}
          aria-label='Página siguiente'
          rel='next'
          className={`${baseControl} bg-az-surface-soft text-az-ink-deep hover:bg-az-hairline-soft`}
        >
          <ChevronRight className='w-4 h-4' />
        </Link>
      )}
    </nav>
  );
};

export default SearchPagination;
