'use client';
import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

type FiltersDisclosureProps = {
  children: React.ReactNode;
  // Pinned below the scrollable body (e.g. the "clear filters" action)
  footer?: React.ReactNode;
};

// Collapsible on mobile, always visible from md up. On md+ the panel is capped
// to the viewport (minus the sticky site header) with three fixed regions:
// head (title + icon), scrollable body, and footer (actions).
const FiltersDisclosure = ({ children, footer }: FiltersDisclosureProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className='md:flex md:flex-col md:max-h-[calc(100vh-7rem)]'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className='md:hidden w-full flex items-center justify-between border border-az-hairline rounded-az-full px-5 py-3 az-body-sm-bold text-az-ink-deep'
      >
        <span className='inline-flex items-center gap-2'>
          <SlidersHorizontal className='w-4 h-4' />
          Filtros
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`${open ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-h-0 pt-5 md:pt-0`}
      >
        <div className='hidden md:flex items-center justify-between pb-4 shrink-0'>
          <h2 className='az-body-md-bold text-az-ink-deep'>Filtros</h2>
          <SlidersHorizontal className='w-4 h-4 text-az-steel' />
        </div>
        <div className='flex-1 min-h-0 overflow-y-auto md:pr-2'>{children}</div>
        {footer && (
          <div className='shrink-0 pt-4 mt-2 border-t border-az-hairline-soft bg-az-canvas'>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltersDisclosure;
