import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';

const Search = async () => {
  return (
    <form action='/search' method='GET' className='relative w-full max-w-lg'>
      <div className='relative flex items-center'>
        <SearchIcon className='absolute left-3 w-4 h-4 text-az-stone pointer-events-none' />
        <Input
          name='q'
          type='search'
          placeholder='Buscar productos...'
          className='w-full pl-9 pr-4 h-10 rounded-az-full bg-az-surface-soft border border-az-hairline-soft focus:ring-1 focus:ring-az-primary focus:border-az-primary text-sm transition-all'
        />
      </div>
    </form>
  );
};

export default Search;
