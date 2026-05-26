'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart, Menu as MenuIcon, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { signOutUser } from '@/lib/actions/user.actions';

type UserInfo = { name: string; role: string } | null;

const MenuMobile = ({
  cartItemsCount = 0,
  userInfo = null,
}: {
  cartItemsCount?: number;
  userInfo?: UserInfo;
}) => {
  return (
    <nav className='md:hidden flex items-center gap-2'>
      {/* Cart icon */}
      <Button
        asChild
        variant='ghost'
        className='relative h-9 w-9 rounded-az-full text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft'
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

      {/* Hamburger sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant='ghost'
            className='h-9 w-9 rounded-az-full text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft'
            aria-label='Abrir menú'
          >
            <MenuIcon className='h-5 w-5' />
          </Button>
        </SheetTrigger>
        <SheetContent className='flex flex-col items-start bg-az-canvas border-az-hairline-soft'>
          <SheetTitle className='az-heading-sm text-az-ink-deep mb-2'>Menú</SheetTitle>

          <div className='w-full flex flex-col gap-1'>
            {/* Cart row */}
            <Button
              asChild
              variant='ghost'
              className='az-body-sm text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft w-full justify-start rounded-az-lg h-11'
            >
              <Link href='/cart' className='flex items-center gap-3'>
                <div className='relative'>
                  <ShoppingCart className='h-4 w-4' />
                  {cartItemsCount > 0 && (
                    <span className='absolute -top-2 -right-2 bg-az-primary text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold leading-none'>
                      {cartItemsCount}
                    </span>
                  )}
                </div>
                <span>Carrito</span>
                {cartItemsCount > 0 && (
                  <span className='ml-auto az-caption text-az-stone'>{cartItemsCount} items</span>
                )}
              </Link>
            </Button>

            <div className='h-px bg-az-hairline-soft my-1' />

            {userInfo ? (
              /* Authenticated state */
              <>
                <div className='px-3 py-2'>
                  <p className='az-body-sm-bold text-az-ink-deep'>{userInfo.name}</p>
                </div>

                <Button
                  asChild
                  variant='ghost'
                  className='az-body-sm text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft w-full justify-start rounded-az-lg h-11'
                >
                  <Link href='/user/profile'>Mi Perfil</Link>
                </Button>
                <Button
                  asChild
                  variant='ghost'
                  className='az-body-sm text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft w-full justify-start rounded-az-lg h-11'
                >
                  <Link href='/user/orders'>Mis Pedidos</Link>
                </Button>

                {(userInfo.role === 'admin' || userInfo.role === 'seller') && (
                  <Button
                    asChild
                    variant='ghost'
                    className='az-body-sm text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft w-full justify-start rounded-az-lg h-11'
                  >
                    <Link href='/admin/overview'>Administrador</Link>
                  </Button>
                )}

                <div className='h-px bg-az-hairline-soft my-1' />

                <form action={signOutUser} className='w-full'>
                  <Button
                    variant='ghost'
                    className='w-full h-11 justify-start az-body-sm text-az-critical hover:text-az-critical hover:bg-red-50 rounded-az-lg px-3 gap-2'
                  >
                    <LogOut className='h-4 w-4' />
                    Cerrar Sesión
                  </Button>
                </form>
              </>
            ) : (
              /* Unauthenticated state */
              <Button
                asChild
                variant='buyCta'
                className='w-full rounded-az-full h-11 mt-2'
              >
                <Link href='/sign-in'>Iniciar Sesión</Link>
              </Button>
            )}
          </div>

          <SheetDescription />
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MenuMobile;
