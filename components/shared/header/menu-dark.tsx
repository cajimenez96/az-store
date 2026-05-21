import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import UserButtonDark from './user-button-dark';
import MenuDarkMobile from './menu-dark-mobile';

const MenuDark = () => {
  return (
    <div className='flex justify-end gap-3'>
      {/* Desktop nav */}
      <nav className='hidden md:flex items-center gap-2'>
        <Button
          asChild
          variant='ghost'
          className='text-white hover:text-white hover:bg-white/10 rounded-pill'
        >
          <Link href='/cart'>
            <ShoppingCart className='h-4 w-4' /> Carrito
          </Link>
        </Button>
        <UserButtonDark />
      </nav>

      {/* Mobile nav — client component for Sheet */}
      <MenuDarkMobile />
    </div>
  );
};

export default MenuDark;
