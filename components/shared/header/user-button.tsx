import Link from 'next/link';
import { auth } from '@/auth';
import { signOutUser } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserIcon } from 'lucide-react';

const UserButton = async () => {
  const session = await auth();

  if (!session) {
    return (
      <Button
        asChild
        variant='outlineLight'
        size='sm'
        className='h-9 px-4 rounded-az-full'
      >
        <Link href='/sign-in'>
          <UserIcon className='h-3.5 w-3.5' />
          Iniciar Sesión
        </Link>
      </Button>
    );
  }

  const firstInitial = session.user?.name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='w-9 h-9 rounded-az-full text-az-ink-deep bg-az-surface-soft hover:bg-az-hairline-soft border border-az-hairline-soft az-body-sm-bold transition-colors'
          >
            {firstInitial}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56 bg-az-canvas border-az-hairline-soft shadow-az-sticky rounded-az-xl'
          align='end'
          forceMount
        >
          <DropdownMenuLabel className='font-normal px-3 py-2'>
            <div className='flex flex-col gap-0.5'>
              <span className='az-body-sm-bold text-az-ink-deep'>
                {session.user?.name}
              </span>
              <span className='az-caption text-az-stone truncate'>
                {session.user?.email}
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className='bg-az-hairline-soft' />

          <DropdownMenuItem asChild className='az-body-sm text-az-ink hover:bg-az-surface-soft focus:bg-az-surface-soft cursor-pointer rounded-az-lg mx-1'>
            <Link href='/user/profile' className='w-full'>
              Mi Perfil
            </Link>
          </DropdownMenuItem>

          {session?.user?.role === 'user' && (
            <DropdownMenuItem asChild className='az-body-sm text-az-ink hover:bg-az-surface-soft focus:bg-az-surface-soft cursor-pointer rounded-az-lg mx-1'>
              <Link href='/user/orders' className='w-full'>
                Historial de Pedidos
              </Link>
            </DropdownMenuItem>
          )}

          {(session?.user?.role === 'admin' || session?.user?.role === 'seller') && (
            <DropdownMenuItem asChild className='az-body-sm text-az-ink hover:bg-az-surface-soft focus:bg-az-surface-soft cursor-pointer rounded-az-lg mx-1'>
              <Link href='/admin' className='w-full'>
                {session?.user?.role === 'admin' ? 'Administrador' : 'Panel de Vendedor'}
              </Link>
            </DropdownMenuItem>
          )}

          {session?.user?.role === 'seller' && (
            <DropdownMenuItem asChild className='az-body-sm text-az-ink hover:bg-az-surface-soft focus:bg-az-surface-soft cursor-pointer rounded-az-lg mx-1'>
              <Link href='/user/orders' className='w-full'>
                Mis Pedidos
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className='bg-az-hairline-soft' />

          <DropdownMenuItem className='p-0 mb-1 rounded-az-lg mx-1 focus:bg-transparent'>
            <form action={signOutUser} className='w-full'>
              <Button
                className='w-full h-9 justify-start az-body-sm text-az-critical hover:text-az-critical hover:bg-red-50 rounded-az-lg px-2'
                variant='ghost'
              >
                Cerrar Sesión
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
