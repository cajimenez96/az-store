import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import UserButton from './user-button';
import MenuMobile from './menu-mobile';
import { auth } from '@/auth';
import { getMyCart } from '@/lib/actions/cart.actions';

const Menu = async () => {
  const [cart, session] = await Promise.all([getMyCart(), auth()]);
  const cartItemsCount = cart ? cart.items.reduce((a, c) => a + c.qty, 0) : 0;

  const userInfo = session?.user
    ? { name: session.user.name ?? '', role: session.user.role ?? 'user' }
    : null;

  return (
    <div className='flex justify-end gap-2 shrink-0'>
      {/* Desktop nav */}
      <nav className='hidden md:flex items-center gap-2'>
        <Button
          asChild
          variant='ghost'
          className='relative h-9 w-9 rounded-az-full text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft transition-colors'
        >
          <Link href='/cart' aria-label='Ver carrito'>
            <ShoppingCart className='h-4 w-4' />
            {cartItemsCount > 0 && (
              <span className='absolute -top-1 -right-1 bg-az-primary text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold leading-none'>
                {cartItemsCount}
              </span>
            )}
          </Link>
        </Button>

        <UserButton />
      </nav>

      {/* Mobile nav — client component for Sheet */}
      <MenuMobile cartItemsCount={cartItemsCount} userInfo={userInfo} />
    </div>
  );
};

export default Menu;
