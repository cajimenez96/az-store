import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllCategories } from '@/lib/actions/category.actions';
import { SearchIcon } from 'lucide-react';

const Search = async () => {
  const { data: categories = [] } = await getAllCategories();

  return (
    <form action='/search' method='GET'>
      <div className='flex w-full max-w-sm items-center space-x-2'>
        <Select name='category'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Todas' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key='All' value='all'>
              Todas
            </SelectItem>
            {categories.map((x) => (
              <SelectItem key={x.id} value={x.slug}>
                {x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          name='q'
          type='text'
          placeholder='Buscar...'
          className='md:w-[100px] lg:w-[300px]'
        />
        <Button>
          <SearchIcon />
        </Button>
      </div>
    </form>
  );
};

export default Search;
