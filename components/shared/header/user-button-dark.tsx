import Link from 'next/link';
import { auth } from '@/auth';
import { signOutUser } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserIcon } from 'lucide-react';

const UserButtonDark = async () => {
  const session = await auth();

  if (!session) {
    return (
      <Button
        asChild
        variant='outlineOnDark'
        className='rounded-pill px-5 py-2 text-sm'
      >
        <Link href='/sign-in'>
          <UserIcon className='h-4 w-4' /> Iniciar Sesión
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
            className='w-9 h-9 rounded-full text-white bg-white/10 hover:bg-white/20 border border-white/20 font-medium'
          >
            {firstInitial}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56 bg-canvas-night-elevated border-hairline-dark text-white'
          align='end'
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <div className='text-sm font-medium leading-none text-white'>
                {session.user?.name}
              </div>
              <div className='text-sm leading-none text-shade-40'>
                {session.user?.email}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuItem className='text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer'>
            <Link href='/user/profile' className='w-full'>
              Mi Perfil
            </Link>
          </DropdownMenuItem>
          {session?.user?.role !== 'admin' && (
          <DropdownMenuItem className='text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer'>
            <Link href='/user/orders' className='w-full'>
              Historial de Pedidos
            </Link>
          </DropdownMenuItem>
          )}

          {session?.user?.role === 'admin' && (
            <DropdownMenuItem className='text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer'>
              <Link href='/admin/overview' className='w-full'>
                Administrador
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem className='p-0 mb-1'>
            <form action={signOutUser} className='w-full'>
              <Button
                className='w-full py-4 px-2 h-4 justify-start text-white hover:text-white hover:bg-white/10'
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

export default UserButtonDark;
