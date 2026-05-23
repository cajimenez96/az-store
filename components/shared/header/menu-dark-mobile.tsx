'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart, EllipsisVertical } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Mobile-only hamburger menu for the dark header.
// This is a Client Component — it uses Sheet which requires client state.
// UserButtonDark is NOT rendered here because it needs auth() (server-only).
// On mobile, the sign-in link is shown as a fallback — UserButtonDark works on desktop.
const MenuDarkMobile = ({ cartItemsCount = 0 }: { cartItemsCount?: number }) => {
  return (
    <nav className='md:hidden'>
      <Sheet>
        <SheetTrigger className='align-middle text-white p-2'>
          <EllipsisVertical className='h-5 w-5' />
        </SheetTrigger>
        <SheetContent className='flex flex-col items-start bg-canvas-night text-white border-hairline-dark'>
          <SheetTitle className='text-white'>Menú</SheetTitle>
          <Button
            asChild
            variant='ghost'
            className='text-white hover:text-white hover:bg-white/10 w-full justify-start'
          >
            <Link href='/cart' className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart className='h-4 w-4' />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span>Carrito</span>
            </Link>
          </Button>
          <Button
            asChild
            variant='ghost'
            className='text-white hover:text-white hover:bg-white/10 w-full justify-start'
          >
            <Link href='/user/profile'>Mi Perfil</Link>
          </Button>
          <Button
            asChild
            variant='ghost'
            className='text-white hover:text-white hover:bg-white/10 w-full justify-start'
          >
            <Link href='/user/orders'>Mis Pedidos</Link>
          </Button>
          <Button
            asChild
            variant='ghost'
            className='text-white hover:text-white hover:bg-white/10 w-full justify-start'
          >
            <Link href='/sign-in'>Iniciar Sesión</Link>
          </Button>
          <SheetDescription></SheetDescription>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MenuDarkMobile;
