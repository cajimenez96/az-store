import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import UserButtonDark from './user-button-dark';
import MenuDarkMobile from './menu-dark-mobile';

import { getMyCart } from '@/lib/actions/cart.actions';

const MenuDark = async () => {
  const cart = await getMyCart();
  const cartItemsCount = cart ? cart.items.reduce((a, c) => a + c.qty, 0) : 0;
  return (
    <div className='flex justify-end gap-3'>
      {/* Desktop nav */}
      <nav className='hidden md:flex items-center gap-2'>
        <Button
          asChild
          variant='ghost'
          className='text-white hover:text-white hover:bg-white/10 rounded-pill'
        >
          <Link href='/cart' className="relative">
            <ShoppingCart className='h-4 w-4' />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                {cartItemsCount}
              </span>
            )}
          </Link>
        </Button>
        <UserButtonDark />
      </nav>

      {/* Mobile nav — client component for Sheet */}
      <MenuDarkMobile cartItemsCount={cartItemsCount} />
    </div>
  );
};

export default MenuDark;
