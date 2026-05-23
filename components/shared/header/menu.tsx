import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import ModeToggle from './mode-toggle';
import Link from 'next/link';
import { EllipsisVertical, ShoppingCart } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserButton from './user-button';
import { auth } from '@/auth';
import NotificationsBell from './notifications-bell';
import { getMyCart } from '@/lib/actions/cart.actions';

const Menu = async () => {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  const cart = await getMyCart();
  const cartItemsCount = cart ? cart.items.reduce((a, c) => a + c.qty, 0) : 0;

  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1'>
        {/* <ModeToggle /> */}
        {isAdmin ? (
          <NotificationsBell />
        ) : (
          <Button asChild variant='ghost' className='relative'>
            <Link href='/cart'>
              <ShoppingCart />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center p-0 rounded-full text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Link>
          </Button>
        )}
        <UserButton />
      </nav>
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle'>
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start'>
            <SheetTitle>Menú</SheetTitle>
            {/* <ModeToggle /> */}
            {isAdmin ? (
              <NotificationsBell />
            ) : (
              <Button asChild variant='ghost' className='relative'>
                <Link href='/cart'>
                  <ShoppingCart />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center p-0 rounded-full text-xs">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
            <UserButton />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
