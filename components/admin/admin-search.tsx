'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

const AdminSearch = () => {
  const pathname = usePathname();
  const formActionUrl = pathname.includes('/admin/orders')
    ? '/admin/orders'
    : pathname.includes('/admin/users')
      ? '/admin/users'
      : '/admin/products';

  const searchParams = useSearchParams();
  const [queryValue, setQueryValue] = useState(searchParams.get('query') || '');

  useEffect(() => {
    setQueryValue(searchParams.get('query') || '');
  }, [searchParams]);

  return (
    <form action={formActionUrl} method='GET' className='relative max-w-xs'>
      <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707072]' />
      <input
        type='search'
        placeholder='Buscar en catálogo / órdenes...'
        name='query'
        value={queryValue}
        onChange={(e) => setQueryValue(e.target.value)}
        className='w-full pl-9 pr-4 py-2 bg-[#f5f5f5] text-xs font-medium text-[#111111] placeholder:text-[#707072] rounded-full border border-transparent focus:border-[#111111] focus:bg-white focus:outline-none transition-all'
      />
      <button className='sr-only' type='submit'>
        Buscar
      </button>
    </form>
  );
};

export default AdminSearch;
