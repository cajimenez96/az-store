import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { getAllCategories } from '@/lib/actions/category.actions';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';

const CategoryDrawer = async () => {
  const { data: categories = [] } = await getAllCategories();

  return (
    <Drawer direction='left'>
      <DrawerTrigger asChild>
        <Button variant='outline'>
          <MenuIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='h-full max-w-sm'>
        <DrawerHeader>
          <DrawerTitle>Seleccioná una categoría</DrawerTitle>
          <div className='space-y-2 mt-4 text-left'>
            {categories.map((x) => (
              <div key={x.id} className="flex flex-col">
                <Button
                  variant='ghost'
                  className='w-full justify-start font-semibold text-base'
                  asChild
                >
                  <DrawerClose asChild>
                    <Link href={`/search?category=${x.slug}`}>
                      {x.name}
                    </Link>
                  </DrawerClose>
                </Button>
                {x.subCategories && x.subCategories.length > 0 && (
                  <div className="pl-4 flex flex-col space-y-1 mt-1 border-l ml-3 border-border/50">
                    {x.subCategories.map((sub: { id: string; name: string; slug: string }) => (
                      <Button
                        variant='ghost'
                        className='w-full justify-start text-sm text-muted-foreground py-1.5 h-auto'
                        key={sub.id}
                        asChild
                      >
                        <DrawerClose asChild>
                          <Link href={`/search?category=${x.slug}&subCategory=${sub.slug}`}>
                            {sub.name}
                          </Link>
                        </DrawerClose>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer;
