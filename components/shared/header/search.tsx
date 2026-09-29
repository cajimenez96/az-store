import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

const Search = async () => {
  return (
    <form action='/search' method='GET' className='relative w-full max-w-md mx-auto'>
      <div className='relative flex items-center group'>
        <SearchIcon className='absolute left-3.5 w-4 h-4 text-nike-mute group-focus-within:text-nike-ink transition-colors pointer-events-none' />
        <Input
          name='q'
          type='search'
          placeholder='Buscar productos...'
          className='w-full pl-10 pr-4 h-10 rounded-full bg-nike-soft-cloud hover:bg-[#eaeaea] focus:bg-white border border-transparent focus:border-nike-ink focus:ring-0 text-sm text-nike-ink placeholder:text-nike-mute transition-all font-sans'
        />
      </div>
    </form>
  );
};

export default Search;
