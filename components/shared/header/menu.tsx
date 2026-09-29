import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import UserButton from './user-button';
import MenuMobile from './menu-mobile';
import { auth } from '@/auth';
import { getMyCart } from '@/lib/actions/cart.actions';
import ThemeToggle from '@/components/shared/theme-toggle';

const Menu = async () => {
  const [cart, session] = await Promise.all([getMyCart(), auth()]);
  const cartItemsCount = cart ? cart.items.reduce((a, c) => a + c.qty, 0) : 0;

  const userInfo = session?.user
    ? { name: session.user.name ?? '', role: session.user.role ?? 'user' }
    : null;

  return (
    <div className='flex items-center justify-end gap-1 sm:gap-2 shrink-0'>
      {/* Desktop nav */}
      <nav className='hidden md:flex items-center gap-1.5'>
        <Button
          asChild
          variant='ghost'
          className='relative h-10 w-10 rounded-full text-nike-ink hover:text-black hover:bg-nike-soft-cloud transition-colors'
        >
          <Link href='/cart' aria-label='Ver carrito'>
            <ShoppingCart className='h-5 w-5' />
            {cartItemsCount > 0 && (
              <span className='absolute top-1 right-1 bg-nike-ink text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold leading-none'>
                {cartItemsCount}
              </span>
            )}
          </Link>
        </Button>

        {/* <ThemeToggle /> */}
      </nav>

      {/* User button — always visible on desktop */}
      <div className='hidden md:block'>
        <UserButton />
      </div>

      {/* Mobile nav — client component for Sheet */}
      <MenuMobile cartItemsCount={cartItemsCount} userInfo={userInfo} />
    </div>
  );
};

export default Menu;
